import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Paperclip,
  Search,
  UserRoundMinus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Avatar } from "@/components/portal/assignee";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { currentUserId, people, personById } from "@/data/people";
import {
  lastReplyAt,
  reviewStage,
  type Attachment,
  type ReviewItem,
} from "@/data/reviews";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** "now", "5m", "2h" */
export function shortAgo(at: number, now: number) {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  return `${Math.round(m / 60)}h`;
}
const ago = (at: number, now: number) => {
  const s = shortAgo(at, now);
  return s === "now" ? "just now" : `${s} ago`;
};
const shortName = (id: string) =>
  id === currentUserId ? "You" : (personById(id)?.short ?? "");

/**
 * The Review tab: who's reviewing at the top, the thread in the middle, the comment box at the bottom.
 * A review is just a comment thread; no status banners or answer buttons.
 */
export function ReviewPanel({ taskId }: { taskId: string }) {
  const { reviewFor, setReviewer, sendReviewComment, toggleResolved, now } =
    useStore();
  const review = reviewFor(taskId);
  const stage = reviewStage(review);
  const reviewer = personById(review.reviewerId);
  const [text, setText] = useState("");
  const [images, setImages] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [review.items.length]);

  const canSend = !!text.trim() && !(stage === 1 && !review.reviewerId);
  const send = () => {
    if (!canSend) return;
    sendReviewComment(taskId, text.trim(), images);
    setText("");
    setImages([]);
  };

  const placeholder =
    stage === 1 && !reviewer
      ? "Pick a reviewer, then ask your question"
      : stage === 1
        ? `Ask ${reviewer!.name.split(" ")[0]} your question`
        : "Reply…";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Reviewer row */}
      <div
        className="flex min-h-[52px] shrink-0 items-center gap-2 border-b border-[#f0f0f0] px-[14px] py-2.5"
        data-change="reviewer-row"
      >
        <span className="w-[54px] shrink-0 text-[12px] text-[#737373]">
          {stage === 3 ? "Asked by" : "Reviewer"}
        </span>
        {stage === 3 ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar person={personById(review.askedById)} size={20} />
            <span className="truncate text-[13px] font-medium">
              {personById(review.askedById)?.short}
            </span>
            <span className="shrink-0 text-[11.5px] text-[#a3a3a3]">
              {ago(review.askedAt!, now)}
            </span>
          </span>
        ) : !reviewer ? (
          <ReviewerPicker
            selectedId={null}
            onPick={(id) => (setReviewer(taskId, id), boxRef.current?.focus())}
          >
            <button className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[7px] border border-[#e5e5e5] bg-white px-2.5 text-left text-[12.5px] text-[#737373] hover:bg-[#fafafa] data-[state=open]:border-[#a3a3a3]">
              <UserRoundPlus className="size-3.5 shrink-0" />
              <span className="flex-1 truncate">Ask a teammate</span>
              <ChevronDown className="size-3.5 shrink-0 text-[#a3a3a3]" />
            </button>
          </ReviewerPicker>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <Avatar person={reviewer} size={20} />
            <span className="shrink-0 text-[13px] font-medium whitespace-nowrap">
              {reviewer.short}
            </span>
            {stage === 2 && (
              <span className="flex min-w-0 items-center gap-1 text-[11.5px] text-[#a3a3a3]">
                <Clock className="size-3 shrink-0" />{" "}
                <span className="truncate">
                  Asked {ago(review.askedAt!, now)}
                </span>
              </span>
            )}
            {stage === 4 && (
              <span className="flex min-w-0 items-center gap-1 text-[11.5px] text-[#a3a3a3]">
                <Check className="size-3 shrink-0" />{" "}
                <span className="truncate">
                  Replied {ago(lastReplyAt(review), now)}
                </span>
              </span>
            )}
            <span className="min-w-0 flex-1" />
            <span className="-mr-1 flex shrink-0">
              <IconButton
                label="Remove reviewer"
                onClick={() => setReviewer(taskId, null)}
              >
                <X className="size-3.5" />
              </IconButton>
            </span>
          </span>
        )}
      </div>

      {/* Timeline */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-[14px] py-3.5"
      >
        {review.items.map((item) => (
          <TimelineItem
            key={item.id}
            item={item}
            now={now}
            onResolve={(id) => toggleResolved(taskId, id)}
          />
        ))}
      </div>

      {/* Comment box, pinned above the action bar */}
      <div className="shrink-0 px-[14px] pb-3">
        <div
          className="flex flex-col rounded-[8px] border border-[#e5e5e5] bg-white focus-within:border-[#a3a3a3]"
          data-change="review-composer"
        >
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2.5 pt-2.5">
              {images.map((img) => (
                <span key={img.id} className="relative">
                  <Thumb image={img} size={48} />
                  <button
                    aria-label={`Remove ${img.name}`}
                    onClick={() =>
                      setImages((a) => a.filter((x) => x.id !== img.id))
                    }
                    className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#171717] text-white"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <textarea
            ref={boxRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={placeholder}
            className="resize-none bg-transparent px-2.5 pt-2 text-[13px] leading-[1.45] outline-none placeholder:text-[#a3a3a3]"
          />
          <div className="flex items-center justify-between px-1.5 pb-1.5">
            <IconButton
              label="Attach images"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="size-3.5" />
            </IconButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                setImages((a) => [
                  ...a,
                  ...files.map((f) => ({
                    id: `${f.name}${f.size}${Math.random()}`,
                    name: f.name,
                    src: URL.createObjectURL(f),
                  })),
                ]);
                e.target.value = "";
              }}
            />
            <button
              aria-label="Send"
              onClick={send}
              disabled={!canSend}
              className="flex size-7 items-center justify-center rounded-full bg-[#171717] text-white disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
            >
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  item,
  now,
  onResolve,
}: {
  item: ReviewItem;
  now: number;
  onResolve: (id: string) => void;
}) {
  if (item.kind !== "comment") {
    const Icon = item.kind === "asked" ? UserRoundPlus : UserRoundMinus;
    const to =
      item.toId === currentUserId ? "you" : personById(item.toId)?.short;
    const verb = item.kind === "asked" ? "asked" : "removed";
    return (
      <div className="flex items-center gap-2 pl-[3px] text-[12px] text-[#737373]">
        <Icon className="size-3.5 shrink-0 text-[#a3a3a3]" />
        <span>
          {shortName(item.byId)} {verb} {to} · {shortAgo(item.at, now)}
        </span>
      </div>
    );
  }
  const who = personById(item.authorId);
  const mine = item.authorId === currentUserId;
  return (
    <div className={cn("group flex gap-2.5", item.resolved && "opacity-60")}>
      <Avatar person={who} size={20} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium">{who?.short}</span>
          <span className="text-[11.5px] text-[#a3a3a3]">
            {shortAgo(item.at, now)}
          </span>
          <span className="flex-1" />
          {/* A reply can be resolved, like Vercel comments */}
          {!mine && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label={item.resolved ? "Unresolve" : "Resolve"}
                  aria-pressed={!!item.resolved}
                  onClick={() => onResolve(item.id)}
                  className={cn(
                    "rounded p-0.5",
                    item.resolved
                      ? "text-[#171717]"
                      : "text-[#a3a3a3] hover:text-[#171717]",
                  )}
                >
                  <CircleCheck
                    className={cn(
                      "size-3.5",
                      item.resolved && "fill-[#171717] text-white",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {item.resolved ? "Resolved" : "Resolve"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-[13px] leading-[1.45] whitespace-pre-wrap text-[#262626]">
          {item.text}
        </p>
        {item.images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {item.images.map((img) => (
              <Thumb key={img.id} image={img} size={72} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Thumb({ image, size }: { image: Attachment; size: number }) {
  if (image.src)
    return (
      <img
        src={image.src}
        alt={image.name}
        className="rounded-[5px] border border-[#e5e5e5] object-cover"
        style={{ width: size, height: size }}
      />
    );
  // Placeholder photo, same look as the photo strip
  return (
    <span
      className="relative block overflow-hidden rounded-[5px]"
      style={{ width: size, height: size, background: image.tone }}
      aria-label={image.name}
      role="img"
    >
      {[0, 1, 2, 3].map((r) => (
        <span
          key={r}
          className="absolute h-[8%] rounded-[2px]"
          style={{
            left: "14%",
            right: "14%",
            top: `${30 + r * 15}%`,
            background: image.bars,
          }}
        />
      ))}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  ...rest
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[#737373] hover:bg-black/5 hover:text-[#171717]"
    >
      {children}
    </button>
  );
}

/** Teammate list: closed until clicked. Search, avatar, name and whether they're on shift. */
function ReviewerPicker({
  selectedId,
  onPick,
  children,
}: {
  selectedId: string | null;
  onPick: (id: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const shown = people.filter(
    (p) =>
      p.id !== currentUserId && p.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQ("");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] gap-0 p-[6px]">
        <div className="mb-1 flex items-center gap-2 rounded-md border border-[#e5e5e5] px-[10px] py-[6px]">
          <Search className="size-3.5 text-[#a3a3a3]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teammates"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
          />
        </div>
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onPick(p.id);
              setOpen(false);
            }}
            className="flex w-full items-center gap-[10px] rounded-md px-2 py-[6px] text-left text-[13px] hover:bg-[#f5f5f5]"
          >
            <Avatar person={p} size={22} />
            <span className="flex-1 truncate">{p.name}</span>
            <span
              className={cn(
                "text-[11.5px]",
                p.onShift ? "text-[#525252]" : "text-[#a3a3a3]",
              )}
            >
              {p.onShift ? "On shift" : "Off shift"}
            </span>
            {p.id === selectedId && <Check className="size-3.5" />}
          </button>
        ))}
        {shown.length === 0 && (
          <div className="px-2 py-3 text-[12.5px] text-[#737373]">
            No teammates match.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Prototype-only switcher, shown in the What's changed panel. */
export function ReviewStateSwitcher({ taskId }: { taskId: string }) {
  const { reviewFor, setReviewStage } = useStore();
  const current = reviewStage(reviewFor(taskId));
  const items: [1 | 2 | 3 | 4, string][] = [
    [1, "No request"],
    [2, "You asked"],
    [3, "You're reviewing"],
    [4, "Reply received"],
  ];
  return (
    <div className="flex flex-col gap-2 border-b border-[#e5e5e5] px-4 py-3">
      <div className="text-[12px] font-medium text-[#737373]">Review state</div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map(([n, label]) => (
          <button
            key={n}
            onClick={() => setReviewStage(taskId, n)}
            aria-pressed={current === n}
            className={cn(
              "rounded-[6px] border px-2 py-1.5 text-left text-[12px] whitespace-nowrap",
              current === n
                ? "border-[#171717] bg-white font-medium text-[#0a0a0a]"
                : "border-[#e5e5e5] text-[#525252] hover:bg-white",
            )}
          >
            {n} · {label}
          </button>
        ))}
      </div>
    </div>
  );
}

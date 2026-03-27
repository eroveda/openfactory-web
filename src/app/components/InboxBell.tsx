import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useInbox, useMarkRead, useMarkAllRead } from "../../hooks/useWorkpacks";
import { useNavigate } from "react-router";
import type { InboxItem } from "../../lib/api";

const TYPE_LABELS: Record<string, string> = {
  WORKPACK_SHARED: "Shared with you",
  APPROVAL_REQUESTED: "Approval requested",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  MENTION: "Mention",
};

export function InboxBell() {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useInbox();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();

  const unread = items.filter(i => !i.read).length;

  const handleClick = (item: InboxItem) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.workpackId) {
      setOpen(false);
      navigate(`/workspace/${item.workpackId}/box`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Inbox</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="size-3" /> Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No notifications
            </div>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors ${
                  !item.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </p>
                    <p className="text-sm text-slate-700 leading-snug">{item.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="size-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

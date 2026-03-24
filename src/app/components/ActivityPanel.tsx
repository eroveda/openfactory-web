import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { CheckCircle2, MessageSquare, UserPlus, Box, Package } from "lucide-react";

interface Activity {
  id: string;
  type: "comment" | "approval" | "collaboration" | "stage-change" | "export";
  user: string;
  initials: string;
  message: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "approval",
    user: "Sarah Miller",
    initials: "SM",
    message: "approved 3 boxes in Shape stage",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "collaboration",
    user: "Sarah Miller",
    initials: "SM",
    message: "added 2 new pins",
    time: "3 hours ago",
  },
  {
    id: "3",
    type: "stage-change",
    user: "You",
    initials: "JD",
    message: "moved workspace to Shape stage",
    time: "1 day ago",
  },
  {
    id: "4",
    type: "comment",
    user: "Sarah Miller",
    initials: "SM",
    message: "commented on B04: 'This needs more detail'",
    time: "1 day ago",
  },
  {
    id: "5",
    type: "collaboration",
    user: "Sarah Miller",
    initials: "SM",
    message: "joined the workspace",
    time: "2 days ago",
  },
];

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "approval":
      return <CheckCircle2 className="size-4 text-green-600" />;
    case "comment":
      return <MessageSquare className="size-4 text-blue-600" />;
    case "collaboration":
      return <UserPlus className="size-4 text-purple-600" />;
    case "stage-change":
      return <Box className="size-4 text-amber-600" />;
    case "export":
      return <Package className="size-4 text-blue-600" />;
  }
};

export function ActivityPanel() {
  return (
    <div className="w-80 bg-white border-l">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Activity</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-125px)]">
        <div className="p-4 space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="size-8 flex-shrink-0">
                <AvatarFallback className="bg-slate-100 text-xs">
                  {activity.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

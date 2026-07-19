import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Pill,
  Upload,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { BottomNavigation } from "./BottomNavigation";

interface NotificationsScreenProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function NotificationsScreen({
  user,
  onNavigate,
  onLogout,
}: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend
useEffect(() => {
  console.log("User object:", user); // 🔍 check if user exists
  if (!user || !(user._id || user.id)) {
    console.warn("⚠️ No user or user._id found, skipping fetch");
    setLoading(false); // ✅ stop loading even if no user
    return;
  }

  const fetchNotifications = async () => {
    try {
      console.log("📡 Fetching notifications for user:", user._id);
      const res = await axios.get(
        `http://localhost:5000/api/notifications/${user._id || user.id}`
      );
      console.log("✅ Fetched data:", res.data);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.notifications || [];

      setNotifications(data);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    } finally {
      console.log("🟢 Setting loading to false");
      setLoading(false);
    }
  };

  fetchNotifications();
}, [user]);



  // Mark as read API
  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "important")
      return n.priority === "important" || n.priority === "urgent";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return Clock;
      case "appointment":
        return Calendar;
      case "medication":
        return Pill;
      case "upload":
        return Upload;
      case "message":
        return MessageSquare;
      case "alert":
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getIconColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      normal: "text-blue-600 bg-blue-100",
      important: "text-orange-600 bg-orange-100",
      urgent: "text-red-600 bg-red-100",
    };
    return colors[priority] || colors["normal"];
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        );
      case "important":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-orange-100 text-orange-800"
          >
            Important
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="text-center p-10 text-gray-600">Loading notifications...</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("patient-dashboard")}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl">Notifications</h1>
                  <p className="text-sm text-gray-600">
                    {notifications.filter((n) => !n.isRead).length} unread
                    notifications
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              {[
                {
                  key: "all",
                  label: "All",
                  count: notifications.length,
                },
                {
                  key: "unread",
                  label: "Unread",
                  count: notifications.filter((n) => !n.isRead).length,
                },
                {
                  key: "important",
                  label: "Important",
                  count: notifications.filter(
                    (n) => n.priority === "important" || n.priority === "urgent"
                  ).length,
                },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={filter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(tab.key)}
                  className="rounded-xl"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-2 py-0 text-xs"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <Card
                key={notification._id}
                className={`rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                  !notification.isRead ? "ring-2 ring-primary/20" : ""
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getIconColor(
                        notification.priority
                      )}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg">{notification.title}</h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.time).toLocaleString()}
                        </span>
                        {notification.isRead && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg text-gray-600 mb-2">No notifications</h3>
              <p className="text-sm text-gray-500">
                {filter === "unread"
                  ? "All caught up! No unread notifications."
                  : filter === "important"
                  ? "No important notifications at this time."
                  : "You're all caught up with notifications."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-12"
              onClick={() => onNavigate("daily-log")}
            >
              <Clock className="w-5 h-5 mr-3" />
              Add Today's Log Entry
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-12"
              onClick={() => onNavigate("reports")}
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload Progress Photo
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-12"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Message Your Doctor
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="notifications"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}

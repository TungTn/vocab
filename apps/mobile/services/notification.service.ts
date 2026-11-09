export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledHour: number; // 24-hour format (e.g. 20 for 8:00 PM)
  scheduledMinute: number;
}

export class NotificationService {
  private scheduledList: ScheduledNotification[] = [];

  scheduleStreakReminder(currentStreak: number, hour = 20, minute = 0): ScheduledNotification {
    const notification: ScheduledNotification = {
      id: `streak-reminder-${Date.now()}`,
      title: "🔥 Đừng để đứt chuỗi học tập!",
      body: `Bạn đã duy trì chuỗi ${currentStreak} ngày liên tục. Hãy dành 5 phút hoàn thành 1 bài học hôm nay!`,
      scheduledHour: hour,
      scheduledMinute: minute
    };

    this.scheduledList.push(notification);
    return notification;
  }

  cancelAllNotifications() {
    this.scheduledList = [];
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduledList];
  }
}

export const notificationService = new NotificationService();

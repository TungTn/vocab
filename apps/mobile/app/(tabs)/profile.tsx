import { notificationService } from "../../services/notification.service";

export function MobileProfileScreen() {
  const scheduleDailyReminder = (streak: number) => {
    return notificationService.scheduleStreakReminder(streak, 20, 0);
  };

  return {
    screen: "Profile",
    scheduleDailyReminder
  };
}

export default MobileProfileScreen;

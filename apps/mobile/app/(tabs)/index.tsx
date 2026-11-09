export interface MobileLearnTabProps {
  onSelectLesson: (lessonId: string) => void;
}

export function MobileLearnScreen({ onSelectLesson }: MobileLearnTabProps) {
  const units = [
    {
      id: "u-1",
      title: "Unit 1: Chào hỏi & Làm quen",
      lessons: [
        { id: "l-1", title: "Lời chào cơ bản", completed: true },
        { id: "l-2", title: "Giới thiệu bản thân", completed: false }
      ]
    },
    {
      id: "u-2",
      title: "Unit 2: Ẩm thực & Nhà hàng",
      lessons: [
        { id: "l-3", title: "Gọi món đồ uống", completed: false }
      ]
    }
  ];

  return {
    screen: "Learn",
    units,
    selectLesson: onSelectLesson
  };
}

export default MobileLearnScreen;

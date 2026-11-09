import { PrismaClient, LanguageLevel, UserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { SYSTEM_ACHIEVEMENTS } from "../src/gamification/achievements.service";
import { SYSTEM_SCENARIOS } from "../src/ai/scenarios.data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Seed] 1. Seeding Curated Decks and Oxford 3000 Flashcards...");

  const oxfordDeck = await prisma.deck.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Oxford 3000™ Core English Vocabulary (A1 - B2)",
      description: "Bộ 3000 từ vựng cốt lõi quan trọng nhất trong tiếng Anh giao tiếp và học thuật theo chuẩn Oxford.",
      language: "en",
      isSystem: true
    }
  });

  const sampleWords = [
    {
      term: "accomplish",
      ipa: "/əˈkʌm.plɪʃ/",
      meaning: "hoàn thành, đạt được (mục tiêu)",
      pos: "verb",
      examples: [
        {
          text: "She accomplished such a lot during her visit.",
          translation: "Cô ấy đã hoàn thành được rất nhiều việc trong chuyến thăm của mình."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=accomplish&type=2"
    },
    {
      term: "cappuccino",
      ipa: "/ˌkæpəˈtʃiːnoʊ/",
      meaning: "cà phê cappuccino bọt sữa",
      pos: "noun",
      examples: [
        {
          text: "Could I have a large cappuccino with oat milk, please?",
          translation: "Cho tôi một ly cappuccino lớn với sữa yến mạch được không?"
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=cappuccino&type=2"
    },
    {
      term: "collaborate",
      ipa: "/kəˈlæb.ə.reɪt/",
      meaning: "hợp tác, phối hợp cùng làm việc",
      pos: "verb",
      examples: [
        {
          text: "Two teams collaborated on the research project.",
          translation: "Hai nhóm đã hợp tác trong dự án nghiên cứu."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=collaborate&type=2"
    },
    {
      term: "croissant",
      ipa: "/krwɑːˈsɑ̃/",
      meaning: "bánh sừng bò xốp bơ",
      pos: "noun",
      examples: [
        {
          text: "Fresh croissants and hot espresso is a classic combination.",
          translation: "Bánh sừng bò mới ra lò và cà phê espresso nóng là một sự kết hợp kinh điển."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=croissant&type=2"
    },
    {
      term: "diligent",
      ipa: "/ˈdɪl.ɪ.dʒənt/",
      meaning: "chăm chỉ, siêng năng, cần cù",
      pos: "adjective",
      examples: [
        {
          text: "He is a diligent student who always finishes his homework on time.",
          translation: "Cậu ấy là một học sinh chăm chỉ luôn hoàn thành bài tập đúng hạn."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=diligent&type=2"
    },
    {
      term: "enthusiasm",
      ipa: "/ɪnˈθjuː.zi.æz.əm/",
      meaning: "sự hăng hái, lòng nhiệt tình",
      pos: "noun",
      examples: [
        {
          text: "Her enthusiasm for learning languages is contagious.",
          translation: "Lòng nhiệt tình học ngoại ngữ của cô ấy có sức lan tỏa lớn."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=enthusiasm&type=2"
    },
    {
      term: "fluent",
      ipa: "/ˈfluː.ənt/",
      meaning: "trôi chảy, lưu loát",
      pos: "adjective",
      examples: [
        {
          text: "She is fluent in three European languages.",
          translation: "Cô ấy nói trôi chảy ba ngôn ngữ châu Âu."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=fluent&type=2"
    },
    {
      term: "reservation",
      ipa: "/ˌrɛzərˈveɪʃən/",
      meaning: "sự đặt chỗ trước (khách sạn, nhà hàng)",
      pos: "noun",
      examples: [
        {
          text: "I have a table reservation under the name John Smith.",
          translation: "Tôi có đặt bàn trước dưới tên John Smith."
        }
      ],
      audioUrl: "https://dict.youdao.com/dictvoice?audio=reservation&type=2"
    }
  ];

  for (const item of sampleWords) {
    const existing = await prisma.flashcard.findFirst({
      where: { deckId: oxfordDeck.id, term: item.term }
    });

    if (!existing) {
      await prisma.flashcard.create({
        data: {
          deckId: oxfordDeck.id,
          term: item.term,
          ipa: item.ipa,
          meaning: item.meaning,
          pos: item.pos,
          examples: item.examples as unknown as object[],
          audioUrl: item.audioUrl
        }
      });
    }
  }

  console.log(`✅ Seeded ${sampleWords.length} flashcards into deck "${oxfordDeck.title}".`);

  // ==========================================
  // 2. SEED COURSES, UNITS & LESSONS
  // ==========================================
  console.log("🌱 [Seed] 2. Seeding English A1 Course, Units, Lessons & Exercises...");

  const course = await prisma.course.upsert({
    where: { code: "en-vi-a1" },
    update: {},
    create: {
      code: "en-vi-a1",
      title: "Tiếng Anh Giao Tiếp Nhập Môn A1",
      description: "Khóa học khởi đầu dành cho người mới bắt đầu: từ vựng căn bản, chào hỏi, giới thiệu và các mẫu câu hàng ngày.",
      language: "en",
      level: LanguageLevel.A1
    }
  });

  // Unit 1
  const unit1 = await prisma.unit.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      courseId: course.id,
      title: "Unit 1: Chào hỏi & Tự giới thiệu",
      description: "Làm quen với các cách chào hỏi và tự giới thiệu tên, tuổi, quê quán.",
      orderIndex: 1
    }
  });

  const lesson1 = await prisma.lesson.upsert({
    where: { id: "20000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000001",
      unitId: unit1.id,
      title: "Bài 1: Lời chào và cách xưng hô",
      orderIndex: 1,
      xpReward: 15
    }
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: "20000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000002",
      unitId: unit1.id,
      title: "Bài 2: Giới thiệu bản thân và nghề nghiệp",
      orderIndex: 2,
      xpReward: 15
    }
  });

  // Exercises for Lesson 1
  const exercisesLesson1 = [
    {
      id: "30000000-0000-0000-0000-000000000001",
      type: "MULTIPLE_CHOICE",
      prompt: "Chọn nghĩa đúng của từ 'Hello' trong tiếng Việt:",
      content: {
        options: ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
        correctAnswer: "Xin chào",
        explanation: "'Hello' là lời chào phổ biến nhất trong tiếng Anh."
      },
      orderIndex: 1
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      type: "LISTEN_AND_PICK",
      prompt: "Nghe đoạn âm thanh và chọn cụm từ thích hợp:",
      audioUrl: "https://dict.youdao.com/dictvoice?audio=good+morning&type=2",
      content: {
        options: ["Good morning", "Good afternoon", "Good evening", "Good night"],
        correctAnswer: "Good morning",
        explanation: "'Good morning' mang nghĩa là chào buổi sáng."
      },
      orderIndex: 2
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      type: "SENTENCE_REORDER",
      prompt: "Sắp xếp các từ sau thành câu hoàn chỉnh:",
      content: {
        words: ["name", "is", "My", "David"],
        correctAnswer: "My name is David",
        explanation: "Cấu trúc giới thiệu tên: My name is + [Tên]."
      },
      orderIndex: 3
    },
    {
      id: "30000000-0000-0000-0000-000000000004",
      type: "FILL_IN_BLANK",
      prompt: "Điền từ còn thiếu vào chỗ trống: 'Nice to ___ you.'",
      content: {
        correctAnswer: ["meet", "see"],
        explanation: "'Nice to meet you' có nghĩa là 'Rất vui được gặp bạn'."
      },
      orderIndex: 4
    },
    {
      id: "30000000-0000-0000-0000-000000000005",
      type: "MATCH_PAIRS",
      prompt: "Nối các từ tiếng Anh với nghĩa tiếng Việt tương ứng:",
      content: {
        pairs: [
          { left: "Hello", right: "Xin chào" },
          { left: "Goodbye", right: "Tạm biệt" },
          { left: "Thank you", right: "Cảm ơn" },
          { left: "Please", right: "Làm ơn" }
        ],
        explanation: "Các mẫu câu lịch sự căn bản trong giao tiếp hàng ngày."
      },
      orderIndex: 5
    }
  ];

  for (const ex of exercisesLesson1) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        prompt: ex.prompt,
        type: ex.type,
        content: ex.content as unknown as object
      },
      create: {
        id: ex.id,
        lessonId: lesson1.id,
        type: ex.type,
        prompt: ex.prompt,
        audioUrl: (ex as any).audioUrl || null,
        content: ex.content as unknown as object,
        orderIndex: ex.orderIndex
      }
    });
  }

  // Exercises for Lesson 2
  const exercisesLesson2 = [
    {
      id: "30000000-0000-0000-0000-000000000006",
      type: "MULTIPLE_CHOICE",
      prompt: "Cụm từ nào dùng để giới thiệu nghề nghiệp 'Tôi là một giáo viên'?",
      content: {
        options: ["I am a teacher", "I have a teacher", "You are teacher", "I work teacher"],
        correctAnswer: "I am a teacher",
        explanation: "Cấu trúc nghề nghiệp: I am a/an + [Nghề nghiệp]."
      },
      orderIndex: 1
    },
    {
      id: "30000000-0000-0000-0000-000000000007",
      type: "SENTENCE_REORDER",
      prompt: "Sắp xếp câu: 'from Vietnam I come'",
      content: {
        words: ["I", "come", "from", "Vietnam"],
        correctAnswer: "I come from Vietnam",
        explanation: "Nói về quê hương: I come from + [Đất nước]."
      },
      orderIndex: 2
    }
  ];

  for (const ex of exercisesLesson2) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        prompt: ex.prompt,
        type: ex.type,
        content: ex.content as unknown as object
      },
      create: {
        id: ex.id,
        lessonId: lesson2.id,
        type: ex.type,
        prompt: ex.prompt,
        audioUrl: (ex as any).audioUrl || null,
        content: ex.content as unknown as object,
        orderIndex: ex.orderIndex
      }
    });
  }

  // Unit 2
  const unit2 = await prisma.unit.upsert({
    where: { id: "10000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000002",
      courseId: course.id,
      title: "Unit 2: Ẩm thực & Nhà hàng",
      description: "Học cách gọi món, hỏi kích cỡ đồ uống và thanh toán hóa đơn.",
      orderIndex: 2
    }
  });

  const lesson3 = await prisma.lesson.upsert({
    where: { id: "20000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000003",
      unitId: unit2.id,
      title: "Bài 1: Gọi đồ uống tại quán cà phê",
      orderIndex: 1,
      xpReward: 15
    }
  });

  const exercisesLesson3 = [
    {
      id: "30000000-0000-0000-0000-000000000008",
      type: "MULTIPLE_CHOICE",
      prompt: "Khi gọi đồ uống lịch sự, bạn nên nói câu nào?",
      content: {
        options: [
          "Could I have a coffee, please?",
          "Give me coffee now",
          "I take coffee",
          "Coffee is good"
        ],
        correctAnswer: "Could I have a coffee, please?",
        explanation: "'Could I have...' là mẫu câu gọi món chuẩn mực và lịch sự nhất."
      },
      orderIndex: 1
    }
  ];

  for (const ex of exercisesLesson3) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        prompt: ex.prompt,
        type: ex.type,
        content: ex.content as unknown as object
      },
      create: {
        id: ex.id,
        lessonId: lesson3.id,
        type: ex.type,
        prompt: ex.prompt,
        audioUrl: (ex as any).audioUrl || null,
        content: ex.content as unknown as object,
        orderIndex: ex.orderIndex
      }
    });
  }

  // ==========================================
  // 3. SEED SPEAKING SCENARIOS
  // ==========================================
  console.log("🌱 [Seed] 3. Seeding AI Speaking Scenarios...");
  for (const sc of SYSTEM_SCENARIOS) {
    await prisma.roleplayScenario.upsert({
      where: { id: sc.id },
      update: {
        title: sc.title,
        description: sc.description,
        level: sc.level as any,
        topic: sc.topic,
        avatarUrl: sc.avatarUrl,
        systemPrompt: sc.systemPrompt,
        initialMessage: sc.initialMessage,
        suggestedPhrases: sc.suggestedPhrases
      },
      create: {
        id: sc.id,
        title: sc.title,
        description: sc.description,
        level: sc.level as any,
        topic: sc.topic,
        avatarUrl: sc.avatarUrl,
        systemPrompt: sc.systemPrompt,
        initialMessage: sc.initialMessage,
        suggestedPhrases: sc.suggestedPhrases
      }
    });
  }

  // ==========================================
  // 4. SEED ACHIEVEMENTS
  // ==========================================
  console.log("🌱 [Seed] 4. Seeding Gamification Achievements...");
  for (const ach of SYSTEM_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: ach.id },
      update: {
        title: ach.title,
        description: ach.description,
        badgeIcon: ach.badgeIcon,
        requirement: ach.requirement,
        category: ach.category,
        gemReward: ach.gemReward
      },
      create: {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        badgeIcon: ach.badgeIcon,
        requirement: ach.requirement,
        category: ach.category,
        gemReward: ach.gemReward
      }
    });
  }

  console.log("🌱 [Seed] 5. Seeding Demo Learner & Admin Accounts...");
  const hashedPassword = await argon2.hash("Password123!", {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });

  await prisma.user.upsert({
    where: { email: "demo@linguaflow.com" },
    update: {
      hearts: 5,
      gems: 150,
      streak: 5,
      xp: 320
    },
    create: {
      email: "demo@linguaflow.com",
      username: "Learner",
      passwordHash: hashedPassword,
      role: UserRole.USER,
      hearts: 5,
      gems: 150,
      streak: 5,
      xp: 320,
      profile: {
        create: {
          displayName: "Learner Demo",
          targetLang: "en",
          nativeLang: "vi",
          currentLevel: "A1",
          dailyGoalMinutes: 15,
          dailyGoalXp: 30
        }
      }
    }
  });

  const adminHashedPassword = await argon2.hash("Admin123!", {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });

  await prisma.user.upsert({
    where: { email: "admin@linguaflow.com" },
    update: {
      role: UserRole.ADMIN
    },
    create: {
      email: "admin@linguaflow.com",
      username: "Admin",
      passwordHash: adminHashedPassword,
      role: UserRole.ADMIN,
      hearts: 5,
      gems: 9999,
      streak: 10,
      xp: 5000,
      profile: {
        create: {
          displayName: "System Admin",
          targetLang: "en",
          nativeLang: "vi",
          currentLevel: "B2",
          dailyGoalMinutes: 30,
          dailyGoalXp: 50
        }
      }
    }
  });

  console.log("🎉 [Seed] Full system seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

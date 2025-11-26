// Mock data for prototype demonstration
export const mockData = {
  // Wedding info
  weddingInfo: {
    groomName: "Dr. Ang Jin Sheng",
    brideName: "Miss Ong Pei Shi",
    groomShortName: "JS",
    brideShortName: "PS",
    date: "2026-01-04",
    venue: "Starview Restaurant",
    address: "Starview Restaurant, Jalan Dato Keramat, Penang",
    fullAddress: "123, Jalan Penang,\n10000 George Town,\nPenang, Malaysia",
    coordinates: {
      latitude: 5.4164,
      longitude: 100.3327
    }
  },

  // Groom profile
  groomProfile: {
    name: "Dr. Ang Jin Sheng",
    role: "The Groom",
    avatar: "👔",
    occupation: "软件工程师",
    hobbies: "摄影、旅行、阅读",
    bio: "热爱生活，享受每一个美好瞬间。相信爱情的力量，期待与心爱的人共度余生。"
  },

  // Bride profile
  brideProfile: {
    name: "Miss Ong Pei Shi",
    role: "The Bride",
    avatar: "👰",
    occupation: "设计师",
    hobbies: "绘画、音乐、美食",
    bio: "充满创意和热情，喜欢用艺术表达情感。相信真爱，期待与对的人一起创造美好回忆。"
  },

  // Photos with Instagram-style data
  photos: [
    {
      id: 1,
      userId: "user1",
      userName: "张三",
      userPhone: "+60123456789",
      userAvatar: "👤",
      imageUrl: "📸",
      caption: "今天真是太美好了！祝福新人 💕",
      tags: ["#婚礼现场", "#美好瞬间"],
      likes: 128,
      likedByMe: true,
      savedByMe: true,
      comments: [
        {
          id: 1,
          userId: "user2",
          userName: "李四",
          text: "太美了！",
          likes: 5,
          likedByMe: false,
          createdAt: "2025-11-26T10:00:00Z"
        },
        {
          id: 2,
          userId: "user3",
          userName: "王五",
          text: "祝福你们！🎉",
          likes: 3,
          likedByMe: true,
          createdAt: "2025-11-26T10:15:00Z"
        }
      ],
      totalComments: 24,
      createdAt: "2025-11-26T08:00:00Z"
    },
    {
      id: 2,
      userId: "user2",
      userName: "李四",
      userPhone: "+60123456788",
      userAvatar: "👤",
      imageUrl: "💕",
      caption: "祝福新人百年好合！🎉",
      tags: ["#祝福", "#新人"],
      likes: 89,
      likedByMe: false,
      savedByMe: false,
      comments: [],
      totalComments: 12,
      createdAt: "2025-11-26T05:00:00Z"
    },
    {
      id: 3,
      userId: "user3",
      userName: "王五",
      userPhone: "+60123456787",
      userAvatar: "👤",
      imageUrl: "🌹",
      caption: "美丽的仪式，祝福新人！",
      tags: ["#仪式", "#新人"],
      likes: 156,
      likedByMe: true,
      savedByMe: true,
      comments: [],
      totalComments: 8,
      createdAt: "2025-11-25T14:00:00Z"
    }
  ],

  // Tags
  tags: [
    { id: 1, name: "#婚礼现场", usageCount: 45 },
    { id: 2, name: "#美好瞬间", usageCount: 32 },
    { id: 3, name: "#祝福", usageCount: 28 },
    { id: 4, name: "#新人", usageCount: 21 },
    { id: 5, name: "#仪式", usageCount: 15 },
    { id: 6, name: "#晚宴", usageCount: 12 },
    { id: 7, name: "#外景", usageCount: 8 },
    { id: 8, name: "#朋友", usageCount: 6 }
  ],

  // Seats
  seats: [
    // Table 1
    { id: 1, tableNumber: 1, seatNumber: 1, guestName: "张三", guestPhone: "+60123456789", occupied: true, isMyS eat: false },
    { id: 2, tableNumber: 1, seatNumber: 2, guestName: "李四", guestPhone: "+60123456788", occupied: true, isMyS eat: false },
    { id: 3, tableNumber: 1, seatNumber: 3, guestName: "王五", guestPhone: "+60123456787", occupied: true, isMyS eat: false },
    { id: 4, tableNumber: 1, seatNumber: 4, guestName: "赵六", guestPhone: "+60123456786", occupied: true, isMyS eat: false },
    { id: 5, tableNumber: 1, seatNumber: 5, guestName: "孙七", guestPhone: "+60123456785", occupied: true, isMyS eat: false },
    { id: 6, tableNumber: 1, seatNumber: 6, guestName: "周八", guestPhone: "+60123456784", occupied: true, isMyS eat: false },
    { id: 7, tableNumber: 1, seatNumber: 7, guestName: "吴九", guestPhone: "+60123456783", occupied: true, isMyS eat: false },
    { id: 8, tableNumber: 1, seatNumber: 8, guestName: "郑十", guestPhone: "+60123456782", occupied: true, isMyS eat: false },
    // Table 2
    { id: 9, tableNumber: 2, seatNumber: 9, guestName: "陈一", guestPhone: "+60123456781", occupied: true, isMyS eat: false },
    { id: 10, tableNumber: 2, seatNumber: 10, guestName: "林二", guestPhone: "+60123456780", occupied: true, isMyS eat: false },
    { id: 11, tableNumber: 2, seatNumber: 11, guestName: "黄三", guestPhone: "+60123456779", occupied: true, isMyS eat: false },
    { id: 12, tableNumber: 2, seatNumber: 12, guestName: "", guestPhone: "", occupied: false, isMySeat: false },
    // Table 3
    { id: 13, tableNumber: 3, seatNumber: 13, guestName: "您", guestPhone: "+60164226901", occupied: true, isMySeat: true },
    { id: 14, tableNumber: 3, seatNumber: 14, guestName: "刘四", guestPhone: "+60123456778", occupied: true, isMyS eat: false },
    { id: 15, tableNumber: 3, seatNumber: 15, guestName: "", guestPhone: "", occupied: false, isMySeat: false },
    { id: 16, tableNumber: 3, seatNumber: 16, guestName: "", guestPhone: "", occupied: false, isMySeat: false }
  ],

  // Guests for seat management
  guests: [
    { id: 1, name: "张三", phone: "+60123456789", seatAssigned: "Table 1 - Seat 1", avatar: "👤" },
    { id: 2, name: "李四", phone: "+60123456788", seatAssigned: "Table 1 - Seat 2", avatar: "👤" },
    { id: 3, name: "王五", phone: "+60123456787", seatAssigned: "Table 1 - Seat 3", avatar: "👤" },
    { id: 4, name: "赵六", phone: "+60123456786", seatAssigned: "Table 2 - Seat 9", avatar: "👤" },
    { id: 5, name: "孙七", phone: "+60123456785", seatAssigned: "未分配", avatar: "👤" }
  ],

  // Videos
  videos: [
    {
      id: 1,
      title: "求婚瞬间",
      description: "浪漫的求婚时刻",
      videoUrl: "",
      thumbnailUrl: "📹",
      duration: "3:24",
      createdAt: "2025-11-20T10:00:00Z"
    },
    {
      id: 2,
      title: "婚纱照拍摄花絮",
      description: "婚纱照拍摄的精彩瞬间",
      videoUrl: "",
      thumbnailUrl: "🎬",
      duration: "5:12",
      createdAt: "2025-11-18T14:00:00Z"
    },
    {
      id: 3,
      title: "朋友祝福视频",
      description: "来自朋友们的祝福",
      videoUrl: "",
      thumbnailUrl: "🎥",
      duration: "2:45",
      createdAt: "2025-11-15T16:00:00Z"
    }
  ],

  // Timeline events
  timeline: [
    {
      id: 1,
      time: "08:00 AM",
      title: "迎亲仪式",
      description: "新郎出发迎娶新娘",
      location: "",
      icon: "☀️"
    },
    {
      id: 2,
      time: "10:00 AM",
      title: "外景拍摄",
      description: "新人及伴郎伴娘外景拍摄",
      location: "",
      icon: "📷"
    },
    {
      id: 3,
      time: "12:00 PM",
      title: "证婚仪式",
      description: "Starview Restaurant",
      location: "Starview Restaurant",
      icon: "💒"
    },
    {
      id: 4,
      time: "01:00 PM",
      title: "午宴开始",
      description: "欢迎各位来宾入席",
      location: "",
      icon: "🍽️"
    },
    {
      id: 5,
      time: "02:00 PM",
      title: "敬酒环节",
      description: "新人向各位来宾敬酒",
      location: "",
      icon: "🥂"
    }
  ],

  // Notifications
  notifications: [
    {
      id: 1,
      type: "photo",
      icon: "❤️",
      title: "新的照片分享",
      message: "张三分享了3张新照片",
      time: "2小时前",
      read: false
    },
    {
      id: 2,
      type: "rsvp",
      icon: "📅",
      title: "RSVP提醒",
      message: "请尽快确认您的出席",
      time: "1天前",
      read: false
    },
    {
      id: 3,
      type: "video",
      icon: "🎥",
      title: "新视频发布",
      message: "求婚瞬间视频已发布",
      time: "3天前",
      read: true
    }
  ]
};


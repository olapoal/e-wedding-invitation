// assets/js/presets.js
// Template & Preset Data Lengkap untuk Aplikasi Generator E-Wedding Invitation

const MUSIC_PRESETS = [
    {
        id: "canon-piano",
        title: "Canon in D (Romantic Piano & Violin)",
        url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=romantic-wedding-piano-10875.mp3"
    },
    {
        id: "acoustic-love",
        title: "Acoustic Wedding Guitar",
        url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=warm-acoustic-wedding-112191.mp3"
    },
    {
        id: "cinematic-strings",
        title: "Cinematic Emotional Strings",
        url: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_946b2b5420.mp3?filename=inspiring-emotional-cinematic-piano-11262.mp3"
    },
    {
        id: "soft-peaceful",
        title: "Peaceful Sweet Romance",
        url: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77270.mp3?filename=gentle-piano-love-story-122941.mp3"
    }
];

const WEDDING_PRESETS = {
    "theme-emerald": {
        themeId: "theme-emerald",
        themeName: "Royal Emerald & Gold",
        musicUrl: MUSIC_PRESETS[0].url,
        musicTitle: MUSIC_PRESETS[0].title,
        cover: {
            title: "The Wedding Of",
            groomNickname: "Rizky",
            brideNickname: "Amanda",
            badgeText: "Save Our Date",
            dateText: "Sabtu, 24 Oktober 2026",
            openBtnText: "Buka Undangan"
        },
        quote: {
            text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
            source: "QS. Ar-Rum: 21"
        },
        groom: {
            fullName: "Rizky Pratama, S.T.",
            nickname: "Rizky",
            parents: "Putra pertama dari Bpk. Ir. Hendra Pratama & Ibu Hj. Ratna Sari",
            instagram: "rizky.pratama",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Amanda Putri Lestari, S.Farm.",
            nickname: "Amanda",
            parents: "Putri kedua dari Bpk. Drs. H. Bambang Subagyo & Ibu Dra. Siti Aminah",
            instagram: "amanda.putri",
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-10-24T08:00",
            akad: {
                title: "Akad Nikah",
                date: "Sabtu, 24 Oktober 2026",
                time: "08:00 - 10:00 WIB",
                venue: "Masjid Agung Grand Ballroom",
                address: "Jl. Sudirman No. 128, Menteng, Jakarta Pusat",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            resepsi: {
                title: "Resepsi Pernikahan",
                date: "Sabtu, 24 Oktober 2026",
                time: "11:00 - 14:00 WIB",
                venue: "The Ritz Emerald Grand Ballroom",
                address: "Jl. Mega Kuningan Barat No. 1, Kuningan, Jakarta Selatan",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            liveStreaming: "https://youtube.com/live"
        },
        story: [
            {
                year: "2020",
                title: "Pertama Kali Bertemu",
                desc: "Pertemuan pertama yang tak sengaja di salah satu kedai kopi di Bandung saat kegiatan kampus. Berawal dari obrolan singkat yang berlanjut hingga berjam-jam."
            },
            {
                year: "2022",
                title: "Komitmen Bersama",
                desc: "Setelah dua tahun saling mengenal dan mendukung dalam suka maupun duka, kami memutuskan untuk berkomitmen melangkah ke jenjang yang lebih serius."
            },
            {
                year: "2026",
                title: "Menuju Babak Baru (Hari Bahagia)",
                desc: "Dengan restu kedua orang tua dan rahmat Allah SWT, kami mantap mengikat janji suci pernikahan untuk mengarungi bahtera rumah tangga selamanya."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        gifts: [
            {
                bank: "BCA",
                accountNumber: "8410293847",
                accountName: "Rizky Pratama"
            },
            {
                bank: "Mandiri",
                accountNumber: "1370018274628",
                accountName: "Amanda Putri Lestari"
            }
        ],
        physicalGift: {
            recipient: "Rizky & Amanda",
            phone: "081234567890",
            address: "Jl. Kemang Raya Indah No. 42, Mampang Prapatan, Jakarta Selatan 12730"
        }
    },

    "theme-blush": {
        themeId: "theme-blush",
        themeName: "Blush Floral Romance",
        musicUrl: MUSIC_PRESETS[1].url,
        musicTitle: MUSIC_PRESETS[1].title,
        cover: {
            title: "Wedding Celebration",
            groomNickname: "Dimas",
            brideNickname: "Sarah",
            badgeText: "We Are Getting Married",
            dateText: "Minggu, 15 November 2026",
            openBtnText: "Buka Undangan"
        },
        quote: {
            text: "Cinta sejati bukanlah menemukan seseorang yang sempurna, melainkan melihat seseorang yang tidak sempurna dengan cara yang sempurna.",
            source: "Sam Keen"
        },
        groom: {
            fullName: "Dimas Satrio, M.M.",
            nickname: "Dimas",
            parents: "Putra dari Bpk. Satrio Wibowo & Ibu Ratnawati",
            instagram: "dimas_satrio",
            photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Sarah Kimberly, B.A.",
            nickname: "Sarah",
            parents: "Putri dari Bpk. Michael Tan & Ibu Veronica Tan",
            instagram: "sarahkimberly",
            photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-11-15T10:00",
            akad: {
                title: "Pemberkatan Kudus",
                date: "Minggu, 15 November 2026",
                time: "10:00 - 12:00 WIB",
                venue: "Gereja Katedral Santo Joseph",
                address: "Jl. Veteran No. 10, Gambir, Jakarta Pusat",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            resepsi: {
                title: "Dinner Reception",
                date: "Minggu, 15 November 2026",
                time: "18:30 - 21:30 WIB",
                venue: "Glass House Botanical Garden",
                address: "Jl. Danau Asri No. 88, BSD City, Tangerang",
                mapLink: "https://maps.google.com/?q=Tangerang"
            },
            liveStreaming: "https://instagram.com"
        },
        story: [
            {
                year: "2019",
                title: "Hello, Sarah!",
                desc: "Kami bertemu saat proyek kemanusiaan di Yogyakarta. Tawa Sarah yang lepas membuat Dimas jatuh hati sejak hari pertama."
            },
            {
                year: "2024",
                title: "She Said YES!",
                desc: "Di bawah gemerlap langit malam Danau Toba, Dimas berlutut dan Sarah mengiyakan ajakan untuk menghabiskan sisa hidup bersama."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1519225429958-3d1487fdfb6e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1544077960-604201fe74bc?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        gifts: [
            {
                bank: "BCA",
                accountNumber: "5271894022",
                accountName: "Dimas Satrio"
            },
            {
                bank: "Bank Jago",
                accountNumber: "1029384756",
                accountName: "Sarah Kimberly"
            }
        ],
        physicalGift: {
            recipient: "Dimas & Sarah",
            phone: "081987654321",
            address: "Cluster Lavender No. 12, Gading Serpong, Tangerang 15810"
        }
    },

    "theme-midnight": {
        themeId: "theme-midnight",
        themeName: "Midnight Starlight Navy",
        musicUrl: MUSIC_PRESETS[2].url,
        musicTitle: MUSIC_PRESETS[2].title,
        cover: {
            title: "Royal Union Of",
            groomNickname: "Kevin",
            brideNickname: "Jessica",
            badgeText: "Written In The Stars",
            dateText: "Sabtu, 12 Desember 2026",
            openBtnText: "Buka Undangan"
        },
        quote: {
            text: "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
            source: "Matius 19:6"
        },
        groom: {
            fullName: "Kevin Wijaya, B.Eng.",
            nickname: "Kevin",
            parents: "Putra dari Bpk. Surya Wijaya & Ibu Linda Wijaya",
            instagram: "kevin.wijaya",
            photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Jessica Aurelia, B.Des.",
            nickname: "Jessica",
            parents: "Putri dari Bpk. Alexander Hartono & Ibu Melinda Hartono",
            instagram: "jessica.aurelia",
            photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-12-12T17:00",
            akad: {
                title: "Holy Matrimony",
                date: "Sabtu, 12 Desember 2026",
                time: "10:00 - 12:00 WIB",
                venue: "St. John Catholic Church",
                address: "Jl. Kencana Raya No. 15, Puri Indah, Jakarta Barat",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            resepsi: {
                title: "Gala Wedding Reception",
                date: "Sabtu, 12 Desember 2026",
                time: "18:00 - 22:00 WIB",
                venue: "The Grand Ballroom Fairmont Hotel",
                address: "Jl. Asia Afrika No. 8, Gelora, Tanah Abang, Jakarta Pusat",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            liveStreaming: "https://youtube.com/live"
        },
        story: [
            {
                year: "2021",
                title: "Under The Same Sky",
                desc: "Saling mengenal saat menempuh studi di Melbourne. Selera humor yang sama dan kecintaan pada seni fotografi merekatkan dua hati."
            },
            {
                year: "2026",
                title: "The Vow",
                desc: "Hari yang dinanti telah tiba, menyatukan cinta kami dalam ikatan suci di hadapan Tuhan dan keluarga tercinta."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        gifts: [
            {
                bank: "BCA",
                accountNumber: "6800192834",
                accountName: "Kevin Wijaya"
            }
        ],
        physicalGift: {
            recipient: "Kevin & Jessica",
            phone: "081122334455",
            address: "Apartemen Senopati Suites Tower 2, Kebayoran Baru, Jakarta Selatan"
        }
    },

    "theme-rustic": {
        themeId: "theme-rustic",
        themeName: "Rustic Terracotta Boho",
        musicUrl: MUSIC_PRESETS[1].url,
        musicTitle: MUSIC_PRESETS[1].title,
        cover: {
            title: "Intimate Wedding",
            groomNickname: "Bagas",
            brideNickname: "Alana",
            badgeText: "Together Is A Beautiful Place To Be",
            dateText: "Sabtu, 5 September 2026",
            openBtnText: "Buka Undangan"
        },
        quote: {
            text: "Cinta tidak terdiri dari saling memandang satu sama lain, melainkan melihat bersama ke arah yang sama.",
            source: "Antoine de Saint-Exupéry"
        },
        groom: {
            fullName: "Bagas Wicaksono",
            nickname: "Bagas",
            parents: "Putra dari Bpk. Gunawan Wicaksono & Ibu Endang",
            instagram: "bagas_wicaksono",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Alana Maheswari",
            nickname: "Alana",
            parents: "Putri dari Bpk. Joko Maheswara & Ibu Yuliana",
            instagram: "alana.maheswari",
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-09-05T15:00",
            akad: {
                title: "Akad Nikah",
                date: "Sabtu, 5 September 2026",
                time: "09:00 - 11:00 WIB",
                venue: "Pine Forest Lembang",
                address: "Jl. Maribaya No. 100, Lembang, Bandung Barat",
                mapLink: "https://maps.google.com/?q=Bandung"
            },
            resepsi: {
                title: "Intimate Sunset Reception",
                date: "Sabtu, 5 September 2026",
                time: "16:00 - 20:00 WIB",
                venue: "The Greenhouse Pine Forest",
                address: "Jl. Maribaya No. 100, Lembang, Bandung Barat",
                mapLink: "https://maps.google.com/?q=Bandung"
            },
            liveStreaming: ""
        },
        story: [
            {
                year: "2018",
                title: "Sahabat Jadi Cinta",
                desc: "Berawal dari teman mendaki gunung hingga menyadari bahwa tempat ternyaman untuk pulang adalah satu sama lain."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "",
        gifts: [
            {
                bank: "BRI",
                accountNumber: "034101002938531",
                accountName: "Bagas Wicaksono"
            }
        ],
        physicalGift: {
            recipient: "Bagas & Alana",
            phone: "085678901234",
            address: "Jl. Ciumbuleuit Atas No. 45, Bandung"
        }
    },

    "theme-islamic": {
        themeId: "theme-islamic",
        themeName: "Islamic Arabesque Syar'i",
        musicUrl: MUSIC_PRESETS[3].url,
        musicTitle: MUSIC_PRESETS[3].title,
        cover: {
            title: "Walimatul 'Ursy",
            groomNickname: "Fikri",
            brideNickname: "Aisyah",
            badgeText: "Menuju Ridho Ilahi",
            dateText: "Ahad, 18 Oktober 2026",
            openBtnText: "Buka Undangan"
        },
        quote: {
            text: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ\n\n'Dan nikahkanlah orang-orang yang masih membujang di antara kamu, dan orang-orang yang layak (berkeluarga) dari hamba-hamba sahayamu yang laki-laki dan perempuan. Jika mereka miskin, Allah akan memampukan mereka dengan karunia-Nya.'",
            source: "QS. An-Nur: 32"
        },
        groom: {
            fullName: "Muhammad Fikri Al-Habsyi, S.E.",
            nickname: "Fikri",
            parents: "Putra dari Bpk. H. Ahmad Al-Habsyi & Ibu Hj. Khadijah",
            instagram: "fikri_alhabsyi",
            photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Aisyah Nurul Jannah, S.Pd.",
            nickname: "Aisyah",
            parents: "Putri dari Bpk. H. Mansyur Ibrahim & Ibu Hj. Fatimah",
            instagram: "aisyah_nuruljannah",
            photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-10-18T08:30",
            akad: {
                title: "Akad Nikah",
                date: "Ahad, 18 Oktober 2026",
                time: "08:30 - 10:30 WIB",
                venue: "Masjid Raya Baiturrahman Ballroom",
                address: "Jl. Teuku Umar No. 1, Semarang Barat",
                mapLink: "https://maps.google.com/?q=Semarang"
            },
            resepsi: {
                title: "Walimatul 'Ursy",
                date: "Ahad, 18 Oktober 2026",
                time: "11:00 - 14:00 WIB",
                venue: "Convention Hall Baiturrahman",
                address: "Jl. Teuku Umar No. 1, Semarang Barat",
                mapLink: "https://maps.google.com/?q=Semarang"
            },
            liveStreaming: "https://youtube.com/live"
        },
        story: [
            {
                year: "2025",
                title: "Proses Ta'aruf & Khitbah",
                desc: "Melalui proses ta'aruf yang syar'i dan restu kedua pihak keluarga besar, niat suci kami berlanjut ke tahap khitbah pada akhir tahun 2025."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "",
        gifts: [
            {
                bank: "BSI (Bank Syariah Indonesia)",
                accountNumber: "7198273645",
                accountName: "Muhammad Fikri"
            }
        ],
        physicalGift: {
            recipient: "Fikri & Aisyah",
            phone: "081324354657",
            address: "Kompleks Griya Asri No. 7, Semarang"
        }
    },

    "theme-monochrome": {
        themeId: "theme-monochrome",
        themeName: "Minimalist Editorial Luxe",
        musicUrl: MUSIC_PRESETS[0].url,
        musicTitle: MUSIC_PRESETS[0].title,
        cover: {
            title: "The Wedding Celebration",
            groomNickname: "Adrian",
            brideNickname: "Chelsea",
            badgeText: "Modern Romance",
            dateText: "Saturday, 7 November 2026",
            openBtnText: "Open Invitation"
        },
        quote: {
            text: "You are my today and all of my tomorrows.",
            source: "Leo Christopher"
        },
        groom: {
            fullName: "Adrian Kusuma",
            nickname: "Adrian",
            parents: "Son of Mr. Robert Kusuma & Mrs. Stephanie",
            instagram: "adrian_kusuma",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Chelsea Olivia",
            nickname: "Chelsea",
            parents: "Daughter of Mr. David Chandra & Mrs. Elizabeth",
            instagram: "chelsea_olivia",
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-11-07T16:00",
            akad: {
                title: "Marriage Ceremony",
                date: "Saturday, 7 November 2026",
                time: "15:00 - 17:00 WIB",
                venue: "The Glass House Pavilion",
                address: "Jl. Senopati No. 44, Jakarta Selatan",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            resepsi: {
                title: "After Party & Cocktail",
                date: "Saturday, 7 November 2026",
                time: "19:00 - Late WIB",
                venue: "The Rooftop Lounge",
                address: "Jl. Senopati No. 44, Jakarta Selatan",
                mapLink: "https://maps.google.com/?q=Jakarta"
            },
            liveStreaming: ""
        },
        story: [
            {
                year: "2022",
                title: "Coffee & Architecture",
                desc: "Two souls colliding in a quaint Tokyo cafe, discovering they speak the exact same language of design and dreams."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "",
        gifts: [
            {
                bank: "BCA",
                accountNumber: "2840192837",
                accountName: "Adrian Kusuma"
            }
        ],
        physicalGift: {
            recipient: "Adrian & Chelsea",
            phone: "081234567890",
            address: "Jl. Gunawarman No. 20, Jakarta Selatan"
        }
    },

    "theme-batik": {
        themeId: "theme-batik",
        themeName: "Nusantara Jawa Klasik",
        musicUrl: MUSIC_PRESETS[3].url,
        musicTitle: MUSIC_PRESETS[3].title,
        cover: {
            title: "Pawiwahan Ageng",
            groomNickname: "Bayu",
            brideNickname: "Sekar",
            badgeText: "Niti Sastra & Asih",
            dateText: "Setu Pahing, 19 Desember 2026",
            openBtnText: "Buka Serat Ulem"
        },
        quote: {
            text: "Tresna iku ora bakal cures, tansah ngrembaka ing samadyaning sukma. Mugi Gusti Ingkang Maha Agung maringi berkah tentrem ing kauripan.",
            source: "Serat Candrarini"
        },
        groom: {
            fullName: "Raden Mas Bayu Prasetyo, S.S.",
            nickname: "Bayu",
            parents: "Putra kakung saking Bpk. K.R.T. Danang Prasetyo & Ibu R.Ay. Sulastri",
            instagram: "bayu_prasetyo",
            photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80"
        },
        bride: {
            fullName: "Raden Roro Sekar Kinanti, S.Sn.",
            nickname: "Sekar",
            parents: "Putri pambayun saking Bpk. R.M. Suryodiningrat & Ibu R.Ay. Endang Kinanti",
            instagram: "sekar_kinanti",
            photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80"
        },
        events: {
            countdownDate: "2026-12-19T09:00",
            akad: {
                title: "Upacara Ijab Qobul & Panggih",
                date: "Setu Pahing, 19 Desember 2026",
                time: "08:00 - 10:30 WIB",
                venue: "Pendopo Ageng Sasana Hinggil",
                address: "Alun-Alun Kidul, Kraton, Yogyakarta",
                mapLink: "https://maps.google.com/?q=Yogyakarta"
            },
            resepsi: {
                title: "Pahargyan Temanten",
                date: "Setu Pahing, 19 Desember 2026",
                time: "11:00 - 14:00 WIB",
                venue: "Bale Ndalem Sasana Hinggil",
                address: "Alun-Alun Kidul, Kraton, Yogyakarta",
                mapLink: "https://maps.google.com/?q=Yogyakarta"
            },
            liveStreaming: "https://youtube.com/live"
        },
        story: [
            {
                year: "2023",
                title: "Pepanggihan Ing Ngayogyakarta",
                desc: "Pitepangan nalika upacara budaya ing Keraton Ngayogyakarta Hadiningrat, tuwuh rasa tresna kang suci lan tulus."
            }
        ],
        gallery: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80"
        ],
        videoUrl: "",
        gifts: [
            {
                bank: "BCA",
                accountNumber: "0371982746",
                accountName: "Bayu Prasetyo"
            }
        ],
        physicalGift: {
            recipient: "Bayu & Sekar",
            phone: "081234987654",
            address: "Ndalem Sasana Asri No. 17, Mantrijeron, Yogyakarta"
        }
    }
};

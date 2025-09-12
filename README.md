# 📚 MangainAja

A modern, fast, and beautiful manga reading web application built with Next.js 15, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![PWA](https://img.shields.io/badge/PWA-Enabled-purple)

## ✨ Features

### 🎯 Core Features
- **Modern Manga Reading** - Clean, distraction-free reading experience
- **Advanced Search** - Filter by genres, language, status, and more
- **Progressive Web App** - Install as a native app on any device
- **Dark/Light Theme** - Automatic system theme detection with manual override
- **Reading History** - Track your reading progress automatically
- **Bookmarks System** - Save your favorite manga for quick access
- **Chapter Navigation** - Seamless next/previous chapter navigation
- **Responsive Design** - Perfect experience on desktop, tablet, and mobile

### 📱 PWA Features
- **Offline Capability** - Cache recently viewed content
- **Native App Feel** - Full-screen experience when installed
- **Fast Loading** - Optimized performance with smart caching
- **Cross-Platform** - Works on iOS, Android, Windows, macOS, and Linux

### 🎨 UI/UX Features
- **Beautiful Interface** - Modern design with smooth animations
- **Touch-Friendly** - Optimized for touch devices and gestures
- **Reading Progress** - Visual progress indicators for chapters
- **Smart Pagination** - Efficient page loading and navigation
- **Customizable Settings** - Personalize your reading experience

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom components with [Radix UI](https://www.radix-ui.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: [Geist Font Family](https://vercel.com/font)

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **GraphQL API** endpoint (see setup guide)

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/NexiaMoe/mangainaja.git
cd mangainaja
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your GraphQL API endpoint
# See SETUP.md for detailed instructions
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler |

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── manga/[id]/        # Manga details pages
│   ├── read/              # Reading interface
│   ├── history/           # Reading history
│   ├── bookmarks/         # Bookmarks page
│   └── settings/          # Settings page
├── components/            # Reusable React components
│   ├── layout/            # Layout components
│   ├── manga/             # Manga-related components
│   ├── reader/            # Reading interface
│   ├── search/            # Search components
│   ├── history/           # History components
│   ├── settings/          # Settings components
│   └── ui/                # Base UI components
├── lib/                   # Utility functions and API
│   ├── api.ts             # GraphQL API functions
│   ├── constants.ts       # App constants
│   └── utils.ts           # Helper utilities
├── stores/                # Zustand state management
│   ├── search-store.ts    # Search state
│   ├── reader-store.ts    # Reader settings
│   ├── reading-history-store.ts # History & bookmarks
│   └── pagination-store.ts # Pagination state
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
    ├── icons/             # PWA icons
    ├── manifest.json      # PWA manifest
    └── sw.js              # Service worker
```

## 🔑 API Requirements

This application requires a compatible GraphQL API that supports:

- **Search API**: `get_content_searchComic`
- **Manga Details**: `get_content_comicNode`
- **Chapter List**: `get_content_chapterList`
- **Chapter Content**: `get_content_chapterNode`

📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)

🔒 **API Access**: The GraphQL endpoint is not publicly available. Contact the maintainer for trusted developer access.

## 🎯 Roadmap

### Phase 1: Enhanced Caching ⏳
- [ ] Improved offline content caching
- [ ] Smart cache management
- [ ] Storage usage monitoring

### Phase 2: Download System 📅 Planned
- [ ] Selective chapter downloads
- [ ] Download queue management
- [ ] Offline library interface

### Phase 3: Advanced Features 🔮 Future
- [ ] Background synchronization
- [ ] Smart recommendations
- [ ] Advanced search filters

See [OFFLINE_READING_PLAN.md](./OFFLINE_READING_PLAN.md) for detailed implementation plans.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain component documentation
- Write meaningful commit messages
- Test on multiple screen sizes

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the app in your browser
2. Look for the install icon in the address bar
3. Click "Install MangainAja"

### Mobile (iOS/Android)
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the share/menu button
3. Select "Add to Home Screen"

## 🐛 Known Issues

- Hydration warnings on theme switching (cosmetic only)
- Service worker cache management needs optimization
- Large manga libraries may impact performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Vercel** - For hosting and deployment platform
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/NexiaMoe/mangainaja/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/NexiaMoe/mangainaja/discussions)
- 🔑 **API Access**: Contact [@NexiaMoe](https://github.com/NexiaMoe)

## ⭐ Show Your Support

If you find this project helpful, please consider:

- ⭐ **Starring** the repository
- 🍴 **Forking** for your own use
- 🐛 **Reporting** bugs you encounter
- 💡 **Suggesting** new features
- 🤝 **Contributing** code improvements

---

<div align="center">

**Made with ❤️ by [NexiaMoe](https://github.com/NexiaMoe)**

*Happy reading! 📚*

</div>
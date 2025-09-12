# MangainAja Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Compatible manga GraphQL API endpoint

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Mangainaja
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your API endpoint
# NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-api-endpoint.com/graphql/
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔑 API Access

This project requires a compatible manga GraphQL API that supports:

- **Search**: `get_content_searchComic`
- **Manga Details**: `get_content_comicNode`
- **Chapter List**: `get_content_chapterList`  
- **Chapter Content**: `get_content_chapterNode`

### Getting API Access

🔒 **The API endpoint is not publicly available.** 

For trusted contributors or serious development interest:
1. Create an issue describing your use case
2. Contact the project maintainer
3. Provide your GitHub profile for verification

**Note**: The API is privately hosted and access is limited to prevent abuse and maintain service quality.

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure
```
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # API and utility functions
├── stores/          # Zustand state management
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## 🚨 Important Notes

1. **Keep your `.env.local` file private** - Never commit it to git
2. **Respect API rate limits** - The API has usage restrictions
3. **Use responsibly** - This is for educational/personal use
4. **Report issues** - Help improve the project by reporting bugs

## 🤝 Contributing

Interested in contributing? Great! Please:

1. Fork the repository
2. Request API access (if needed)
3. Create a feature branch
4. Submit a pull request with clear description

## 📞 Support

- 🐛 **Bug Reports**: Open a GitHub issue
- 💡 **Feature Requests**: Create a discussion
- 🔑 **API Access**: Contact maintainer with use case

---

**Remember**: This project is for educational and personal use. Please respect the terms of service of any external APIs or websites.
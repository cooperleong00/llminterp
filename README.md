# LLMInterp Paper List

A web application for browsing and searching papers related to LLM interpretability.

## Features

- **Search**: Use Fuse.js for searching papers by title, abstract, authors, or tags
- **Filter**: Filter papers by tags and categories
- **Sort**: Sort papers by tag-based grouping, newest first, or search relevance
- **Responsive UI**: Built with React and DaisyUI for a clean, modern interface

## Getting Started

### Development

1. Clone the repository:
   ```
   git clone https://github.com/YOURUSERNAME/llminterp.git
   cd llminterp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

The application is configured for GitHub Pages deployment. To deploy:

1. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOURUSERNAME.github.io/llminterp"
   ```

2. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

## Adding Papers

Papers are stored in the `public/data/papers.json` file. To add a new paper:

1. Add a new entry to the JSON array with the following fields:
   ```json
   {
     "id": 6,
     "title": "Your Paper Title",
     "tags": ["tag1", "tag2"],
     "primaryTag": "primary-category",
     "year": 2024,
     "authors": ["Author, A.", "Author, B."],
     "abstract": "Abstract of the paper...",
     "urls": {
       "arxiv": "https://arxiv.org/abs/XXXX.XXXXX",
       "github": "https://github.com/example/repo"
     }
   }
   ```

2. Tags are defined in `public/data/tags.json`. To add new tags, update this file with the new tag structure.

## License

MIT

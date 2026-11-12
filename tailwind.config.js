export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paddy: "#2F5D34",
        leaf: "#5B8C3A",
        soil: "#7A4B26",
        sun: "#F2B134",
        sky: "#E8F1F5",
        cream: "#FBF8F1",
      },
      fontFamily: {
        sans: [
          '"Noto Sans Telugu"',
          '"Noto Sans Devanagari"',
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

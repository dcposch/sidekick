![Screenshot](https://user-images.githubusercontent.com/169280/218654033-7d5749e7-d1ce-4b1a-8046-89a4160b90e5.gif)

Sidekick lets you transform text using AI.

It comes with a few transformations, and you can add your own just by
describing what you want done in English.

## Usage

Select any editable text. Then, on a Mac, use `Cmd+Shift+E` to pick a transform. Otherwise, `Ctrl+Shift+E`.

## Development

```
npm ci
npm run build
```

Then, navigate to [](chrome://extensions) and load `dist` as an unpacked extension.

For development, use

```
npm run watch
```

## Credits

Inspired by Varun's [Coauthor](https://github.com/varunshenoy/coauthor)
extension, which lets you write LaTeX using AI.

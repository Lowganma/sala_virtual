export type PastedCanvasImage = {
  src: string;
  type: "image" | "gif";
  file?: File;
};

const DIRECT_IMAGE_URL_PATTERN = /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i;

export function isTypingInEditableElement() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.getAttribute("contenteditable") === "true"
  );
}

function getImageType(src: string): "image" | "gif" {
  return /\.gif(\?.*)?$/i.test(src) ? "gif" : "image";
}

function getImageFromHtml(html: string) {
  const parser = new DOMParser();
  const documentFromClipboard = parser.parseFromString(html, "text/html");
  const imageElement = documentFromClipboard.querySelector("img");

  return imageElement?.getAttribute("src") || "";
}

export function getPastedCanvasImage(event: ClipboardEvent) {
  const text = event.clipboardData?.getData("text/plain")?.trim();

  if (text && DIRECT_IMAGE_URL_PATTERN.test(text)) {
    return {
      src: text,
      type: getImageType(text),
    } satisfies PastedCanvasImage;
  }

  const html = event.clipboardData?.getData("text/html");

  if (html) {
    const imageSrc = getImageFromHtml(html);

    if (imageSrc && DIRECT_IMAGE_URL_PATTERN.test(imageSrc)) {
      return {
        src: imageSrc,
        type: getImageType(imageSrc),
      } satisfies PastedCanvasImage;
    }
  }

  const clipboardItems = Array.from(event.clipboardData?.items || []);
  const imageItem = clipboardItems.find((item) =>
    item.type.startsWith("image/")
  );
  const file = imageItem?.getAsFile();

  if (!file) {
    return null;
  }

  return {
    src: URL.createObjectURL(file),
    type: file.type === "image/gif" ? "gif" : "image",
    file,
  } satisfies PastedCanvasImage;
}

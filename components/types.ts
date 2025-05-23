export interface FileMeta {
  name: string;
  size: number; // Encrypted size
  originalSize: number; // Original size
  type: string;
}

export interface ReceivedFile {
  url: string;
  name: string;
}

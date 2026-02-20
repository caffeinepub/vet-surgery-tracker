declare module 'tesseract.js' {
  export interface Logger {
    status: string;
    progress: number;
    userJobId?: string;
    workerId?: string;
  }

  export interface WorkerOptions {
    logger?: (log: Logger) => void;
    errorHandler?: (error: Error) => void;
    langPath?: string;
    cachePath?: string;
    cacheMethod?: string;
    workerPath?: string;
    corePath?: string;
    legacyCore?: boolean;
    legacyLang?: boolean;
  }

  export interface Rectangle {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  export interface RecognizeOptions {
    rectangle?: Rectangle;
  }

  export interface Word {
    text: string;
    confidence: number;
    baseline: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      has_baseline: boolean;
    };
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }

  export interface Line {
    text: string;
    confidence: number;
    baseline: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      has_baseline: boolean;
    };
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    words: Word[];
  }

  export interface Paragraph {
    text: string;
    confidence: number;
    baseline: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      has_baseline: boolean;
    };
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    lines: Line[];
  }

  export interface Block {
    text: string;
    confidence: number;
    baseline: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      has_baseline: boolean;
    };
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    paragraphs: Paragraph[];
  }

  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      blocks: Block[];
      paragraphs: Paragraph[];
      lines: Line[];
      words: Word[];
      hocr: string;
      tsv: string;
    };
  }

  export interface Worker {
    load(): Promise<void>;
    loadLanguage(lang: string | string[]): Promise<void>;
    initialize(lang: string | string[]): Promise<void>;
    setParameters(params: Record<string, any>): Promise<void>;
    recognize(
      image: string | File | Blob | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
      options?: RecognizeOptions
    ): Promise<RecognizeResult>;
    detect(image: string | File | Blob): Promise<any>;
    terminate(): Promise<void>;
    reinitialize(lang: string | string[]): Promise<void>;
  }

  export function createWorker(
    lang?: string | string[],
    oem?: number,
    options?: WorkerOptions
  ): Promise<Worker>;

  export function createScheduler(): any;

  export enum PSM {
    OSD_ONLY = 0,
    AUTO_OSD = 1,
    AUTO_ONLY = 2,
    AUTO = 3,
    SINGLE_COLUMN = 4,
    SINGLE_BLOCK_VERT_TEXT = 5,
    SINGLE_BLOCK = 6,
    SINGLE_LINE = 7,
    SINGLE_WORD = 8,
    CIRCLE_WORD = 9,
    SINGLE_CHAR = 10,
    SPARSE_TEXT = 11,
    SPARSE_TEXT_OSD = 12,
    RAW_LINE = 13,
  }

  export enum OEM {
    TESSERACT_ONLY = 0,
    LSTM_ONLY = 1,
    TESSERACT_LSTM_COMBINED = 2,
    DEFAULT = 3,
  }
}

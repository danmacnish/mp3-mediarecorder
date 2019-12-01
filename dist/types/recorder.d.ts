/// <reference types="dom-mediacapture-record" />
import { GlobalConfig, Mp3MediaRecorderOptions } from './types/config.type';
declare class Mp3MediaRecorder extends MediaRecorder {
    constructor(stream: MediaStream, options?: Mp3MediaRecorderOptions);
}
export declare const getMp3MediaRecorder: (config: GlobalConfig) => Promise<typeof Mp3MediaRecorder>;
export {};

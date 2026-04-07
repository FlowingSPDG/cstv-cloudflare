/** /sync JSON (gotv-plus-go gotv.Sync + VDC fields) */
export type SyncResponse = {
  tick: number;
  endtick?: number;
  rtdelay?: number;
  rcvage?: number;
  fragment: number;
  signup_fragment: number;
  tps: number;
  keyframe_interval?: number;
  map: string;
  protocol: number;
  token_redirect?: string;
};

import { Chorus, CHORUS_DANCE_SEC } from "./01_03_Chorus";
import { NightGlowEffect } from "../../../lib/effects/wrappers/NightGlowEffect";

/**
 * 2番のサビ。1番のサビと同じ絵柄・同じ動きにして、サビが来たことを分かりやすくする。
 * ただし、きょろきょろしている間だけ全体を暗く落として白目を光らせ、
 * ふわふわ浮き始めるところ（CHORUS_DANCE_SEC）で元の明るさへ戻す
 */
export const Chorus2 = () => {
  return (
    <NightGlowEffect durationSec={CHORUS_DANCE_SEC}>
      <Chorus />
    </NightGlowEffect>
  );
};

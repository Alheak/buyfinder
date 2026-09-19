/**
 * Only use kana with normalized characters
 * Refer to ../mixins/jpRegex
 */
export const aliases: {
  [key: string]: [RegExp, string, boolean?][] // [term to match, alias, replace? (instead of adding as a new term)]
} = {
  classification: [
    [/ポップアップパレード/u, 'POP UP PARADE', true],
    [/Dollfie Dream/i, 'DD'],
    [/KD Colle/i, 'KDcolle'],
    [/エス エイチ フィギュアーツ/u, 'S.H.フィギュアーツ', true],
    [/アートエフエックス ジェイ/u, 'ARTFX J', true],
    [/SQシリーズ/ui, 'SQ', true],
    [/PenLife/i, 'PenFriend'],
    [/ビッキュートバニーズ/u, 'BiCute Bunnies'],
    [/Comics, Doujinshi/i, 'doujinshi', true],
    [/漫画, 同人誌/u, '同人誌', true]
  ],
  char: [
    [/ヨルハ二号B型/ui, '2B', true],
    [/Takarabako no Monster Octopus Girl/i, 'Treasure Chest Monster Octopus Girl'],
    [/Blood Queen Ysmir/i, 'Blood Queen'],
    [/POP GIRL #[0-9]+/i, 'POP GIRL'],
    [/Sophon/i, 'Zhi Zi'],
    [/Rabbi/i, 'Rabi'],
    [/Jeanne d\'Arc \(Alter\)/i, 'Avenger Jeanne D\'Arc'],
    [/Jeanne d\'Arc \(Alter\)/i, 'Jeanne D\'Arc Avenger'],
    [/ジャンヌ・ダルク \[オルタ\]/u, 'アヴェンジャージャンヌダルク'],
    [/ジャンヌ・ダルク \[オルタ\]/u, 'ジャンヌダルクアヴェンジャー']
  ],
  title: [
    [/Takarabako no Monster Octopus Girl/i, 'Treasure Chest Monster Octopus Girl'],
    [/Blood Queen Ysmir/i, 'Blood Queen'],
    [/POP GIRL #[0-9]+/i, 'POP GIRL'],
    [/Rabbi/i, 'Rabi'],
    [/Moonlit Archives \- Original Soundtrack 1/i, '真月譚 月姫 オリジナルサウンドトラック1']
  ],
  origin: [
    [/Fire Emblem/i, 'Fire Emblem'],
    [/ファイアーエムブレム/u, 'ファイアーエムブレム'],
    [/Danganronpa/i, 'Danganronpa'],
    [/ダンガンロンパ/u, 'ダンガンロンパ'],
    [/ニーア オートマタ/u, 'NieR Automata'],
    [/フォールアウト/u, 'Fallout'],
    [/メタルギア/u, 'Metal Gear'],
    [/Isekai Meikyuu de Harem o/i, 'Slave Harem in the Labyrinth of the Other World'],
    [/シュタインズ ゲート/u, 'Steins;Gate'],
    [/Mahou Shoujo ni Akogarete/i, 'Gushing over Magical Girls'],
    [/Gundam/i, 'Gundam'],
    [/(?<!\p{Script=Katakana})アリア(?!\p{Script=Katakana})/u, 'Aria'],
    [/Umamusume/i, 'Umamusume', true],
    [/ウマ娘/u, 'ウマ娘', true],
    [/NIKKE/i, 'NIKKE', true],
  ],
  manufacturer: [
    [/インテリジェントシステムズ/u, 'インテリジェントシステムズ'],
    [/リコルヌ/u, 'リコルヌ'],
    [/アルター/u, 'Alter'],
    [/(Good(\s)?Smile Company|グッドスマイル(\s)?カンパニー)/ui, 'GSC'],
    [/ホビーサクラ/u, 'HOBBY SAKURA'],
    [/Apex Innovation/i, 'APEX', true],
    [/ネイティブ/u, 'Native'],
    [/核糖/u, 'Ribose'],
    [/バインディング/u, 'BINDing', true],
    [/角川書店/u, 'KADOKAWA', true],
    [/角川書店/u, 'カドカワ', true],
    [/株式会社BANDAI SPIRITS/ui, 'BANDAI SPIRITS', true],
    [/BANDAI/i, 'バンダイ'],
    [/Bear Panda/i, 'BearPanda'],
    [/ぶぶたた/u, 'ぶぶたた', true],
    [/ギフト/u, 'Gift', true],
    [/パーティルック/u, 'Party Look', true]
  ],
  version: [
    [/limited/i, '限定']
  ]
}


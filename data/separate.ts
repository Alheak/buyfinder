export const separate: { [key: string]: [RegExp, { [key: string]: RegExp }][] } = {
  version: [
    [
      /(saber|lancer|assassin|rider|archer|caster|berserker|ruler|avenger|foreigner|pretender|shielder|alter|セイバー|ランサー|アサシン|ライダー|アーチャー|キャスター|バーサーカー|ルーラー|アヴェンジャー|フォーリナー|プリテンダー|シールダー|オルタ)/gi,
      { origin: /fate/i }
    ]
  ]
}

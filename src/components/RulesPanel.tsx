import { GameGlyph } from './GameGlyph';

type RulesPanelProps = Readonly<{
  mechanics: readonly string[];
  objective?: string;
  hint?: string;
}>;

export function RulesPanel({ mechanics, objective, hint }: RulesPanelProps) {
  return (
    <aside className="rules-panel">
      <section>
        <h3>目标</h3>
        <p className="rules-panel__objective">{objective ?? '让所有真实方块完整覆盖匹配 Goal。'}</p>
        {hint ? <p className="rules-panel__hint"><strong>提示：</strong>{hint}</p> : null}
      </section>
      <section>
        <h3>这一关</h3>
        <ul className="mechanic-list">
          {mechanics.map((mechanic) => (
            <li key={mechanic}>{mechanic}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>输入</h3>
        <p>方向键或 WASD 移动；Z 撤销；R 重开。一次有效输入结算一次环境回合。</p>
      </section>
      <section>
        <h3>读图</h3>
        <p className="rules-panel__visual-language">这是原作的暗场几何语法：形状区分物体，颜色只留给角色、危险、可推 Goal 与 Gate；雨是前景 VFX，不给格子染色。</p>
        <dl className="legend">
          <div><dt><GameGlyph kind="player" /></dt><dd>角色：黄色实心方块。</dd></div>
          <div><dt><GameGlyph kind="block" number="2" /></dt><dd>真实 Block：白色实心方块；中心数字是编号。</dd></div>
          <div><dt><GameGlyph kind="fake-block" /></dt><dd>Fake Block：灰色实心方块；可推、会阻挡，但不计入胜利。</dd></div>
          <div><dt><GameGlyph kind="goal" number="2" /></dt><dd>Goal：白色四角框；数字相同的 Block 才能完成它。</dd></div>
          <div><dt><GameGlyph kind="movable-goal" /></dt><dd>可推动 Goal：黄色四角框；被 Block 挡住时角色可穿过。</dd></div>
          <div><dt><GameGlyph kind="terrain-goal" /></dt><dd>地面 Goal：白色四角框，是地形而非另一个物体。</dd></div>
          <div><dt><GameGlyph kind="moving-spike" /></dt><dd>Spike：红色爆裂星；细红线是它每回合经过的路径。</dd></div>
          <div><dt><GameGlyph kind="gate-blue" /></dt><dd>Gate：蓝、橙双层方框成对，进入后保持移动方向。</dd></div>
          <div><dt><GameGlyph kind="wall" /></dt><dd>Wall：一笔白色边框围出不可穿过的区域。</dd></div>
        </dl>
      </section>
    </aside>
  );
}

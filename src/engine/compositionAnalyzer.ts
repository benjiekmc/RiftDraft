import { CHAMPION_BY_ID } from '../data/champions';
import {
  AppLanguage,
  ChampionDefinition,
  CompositionAnalysis,
  CompositionWarning,
  TeamProfileSummary,
} from '../types/draft';

export function summarizeTeam(championIds: (string | null)[]): {
  champs: ChampionDefinition[];
  profile: TeamProfileSummary;
} {
  const champs = championIds
    .filter((id): id is string => Boolean(id))
    .map((id) => CHAMPION_BY_ID[id])
    .filter((c): c is ChampionDefinition => Boolean(c));

  const profile: TeamProfileSummary = {
    physicalCount: 0,
    magicCount: 0,
    frontlineCount: 0,
    engageCount: 0,
    ccCount: 0,
    peelCount: 0,
    earlyCount: 0,
    scalingCount: 0,
    diveThreatCount: 0,
  };

  for (const champ of champs) {
    if (champ.tags.includes('Physical Damage')) profile.physicalCount += 1;
    if (champ.tags.includes('Magic Damage')) profile.magicCount += 1;
    if (champ.tags.includes('Frontline') || champ.tags.includes('Tank')) profile.frontlineCount += 1;
    if (champ.tags.includes('Engage')) profile.engageCount += 1;
    if (champ.tags.includes('Crowd Control')) profile.ccCount += 1;
    if (champ.tags.includes('Peel') || champ.tags.includes('Disengage')) profile.peelCount += 1;
    if (champ.tags.includes('Early Game')) profile.earlyCount += 1;
    if (champ.tags.includes('Scaling')) profile.scalingCount += 1;
    if (champ.diveThreat >= 75) profile.diveThreatCount += 1;
  }

  return { champs, profile };
}

export function analyzeTeamComposition(
  alliedIds: (string | null)[],
  enemyIds: (string | null)[],
  lang: AppLanguage = 'en'
): CompositionAnalysis {
  const { champs: allies, profile: alliedProfile } = summarizeTeam(alliedIds);
  const { champs: enemies, profile: enemyProfile } = summarizeTeam(enemyIds);
  const zh = lang === 'zh-TW';

  const warnings: CompositionWarning[] = [];

  // Allied damage balance checks
  if (allies.length >= 2) {
    if (alliedProfile.physicalCount >= 3 && alliedProfile.magicCount === 0) {
      warnings.push({
        id: 'heavy-ad',
        severity: 'risk',
        message: zh
          ? '我方陣容過度偏向物理傷害。'
          : 'Your team is heavily physical-damage based.',
        detail: zh
          ? '建議補上魔法輸出英雄，避免敵方坦克輕鬆堆疊物防。'
          : 'Consider adding magic damage so enemy tanks cannot stack armor efficiently.',
      });
    } else if (alliedProfile.physicalCount >= 2 && alliedProfile.magicCount === 0) {
      warnings.push({
        id: 'need-ap',
        severity: 'caution',
        message: zh ? '建議補充魔法傷害。' : 'Consider adding magic damage.',
        detail: zh
          ? '目前我方已選英雄皆以物理傷害為主。'
          : 'Allied picks currently deal physical damage only.',
      });
    } else if (alliedProfile.magicCount >= 3 && alliedProfile.physicalCount === 0) {
      warnings.push({
        id: 'heavy-ap',
        severity: 'risk',
        message: zh
          ? '我方陣容過度偏向魔法傷害。'
          : 'Your team is heavily magic-damage based.',
        detail: zh
          ? '建議補上物理持續輸出，以維持推塔與巴龍/小龍物件壓力。'
          : 'Consider adding physical damage for sustained tower and objective pressure.',
      });
    } else if (alliedProfile.magicCount >= 2 && alliedProfile.physicalCount === 0) {
      warnings.push({
        id: 'need-ad',
        severity: 'caution',
        message: zh ? '建議補充物理傷害。' : 'Consider adding physical damage.',
        detail: zh
          ? '目前我方已選英雄皆以魔法傷害為主。'
          : 'Allied picks currently rely exclusively on magic damage.',
      });
    }
  }

  // Allied frontline check
  if (allies.length >= 2 && alliedProfile.frontlineCount === 0) {
    warnings.push({
      id: 'no-frontline',
      severity: allies.length >= 3 ? 'risk' : 'caution',
      message: zh ? '我方陣容缺乏前排。' : 'Your team lacks frontline.',
      detail: zh
        ? '補上坦克或前排鬥士可大幅提升小龍與巴龍團戰穩定度。'
        : 'Adding a Tank or Frontline bruiser improves Dragon/Baron contest stability.',
    });
  }

  // Allied engage check
  if (allies.length >= 2 && alliedProfile.engageCount === 0) {
    warnings.push({
      id: 'no-engage',
      severity: 'caution',
      message: zh ? '我方缺乏穩定開戰手段。' : 'Your team lacks reliable engage.',
      detail: zh
        ? '沒有先手開團角色時，5v5 正面團戰較難主動掌握節奏。'
        : 'Without an initiator, your team may struggle to start favorable 5v5 fights.',
    });
  }

  // Allied CC check
  if (allies.length >= 2 && alliedProfile.ccCount <= 1) {
    warnings.push({
      id: 'low-cc',
      severity: 'caution',
      message: zh ? '建議補充控制技能。' : 'Consider adding crowd control.',
      detail: zh
        ? '更多控制能有效懲罰高機動刺客並提高小規模碰撞勝率。'
        : 'More lockdown helps punish mobile assassins and secure skirmishes.',
    });
  }

  // Enemy composition threats
  if (enemies.length >= 2 && enemyProfile.diveThreatCount >= 2) {
    const hasPeel = alliedProfile.peelCount >= 1;
    warnings.push({
      id: 'enemy-dive',
      severity: hasPeel ? 'caution' : 'risk',
      message: zh ? '敵方陣容具備極高強開/衝排威脅。' : 'Enemy team has strong dive potential.',
      detail: hasPeel
        ? zh
          ? '團戰時請善用反開與保排技能保護後排輸出。'
          : 'Protect backline carries with your disengage tools.'
        : zh
          ? '建議選擇保排或反開英雄以保護我方核心輸出。'
          : 'Consider adding Peel or Disengage to protect your carries.',
    });
  }

  if (enemies.length >= 2 && enemyProfile.ccCount >= 3) {
    warnings.push({
      id: 'enemy-cc',
      severity: 'risk',
      message: zh ? '敵方陣容擁有大量控制技能。' : 'Enemy composition has strong crowd control.',
      detail: zh
        ? '無位移英雄或脆皮近戰進場時將面臨極高被控風險。'
        : 'Immobile or squishy melee picks face high lockdown risk.',
    });
  }

  if (
    enemies.length >= 2 &&
    enemyProfile.frontlineCount >= 2 &&
    alliedProfile.frontlineCount === 0 &&
    allies.length >= 2
  ) {
    warnings.push({
      id: 'enemy-frontline-gap',
      severity: 'caution',
      message: zh ? '敵方前排厚度明顯較高。' : 'Enemy team has a stronger frontline.',
      detail: zh
        ? '需要持續輸出或打坦能力來突破敵方防線。'
        : 'Sustained damage or tank-shredding tools will help break through.',
    });
  }

  return {
    alliedProfile,
    enemyProfile,
    warnings,
  };
}

export interface CandidateFitEvaluation {
  allyFitScore: number; // 0-100
  enemyFitScore: number; // 0-100
  fitReasons: string[];
  fitSummary: string;
  riskNote: string;
}

export function evaluateCandidateCompositionFit(
  candidate: ChampionDefinition,
  alliedIds: (string | null)[],
  enemyIds: (string | null)[],
  lang: AppLanguage = 'en'
): CandidateFitEvaluation {
  const { champs: allies, profile: alliedProfile } = summarizeTeam(alliedIds);
  const { champs: enemies, profile: enemyProfile } = summarizeTeam(enemyIds);
  const zh = lang === 'zh-TW';

  let allyScore = 52;
  const fitReasons: string[] = [];

  const isMagic = candidate.tags.includes('Magic Damage');
  const isPhysical = candidate.tags.includes('Physical Damage');
  const isFrontline = candidate.tags.includes('Frontline') || candidate.tags.includes('Tank');
  const hasEngage = candidate.tags.includes('Engage');
  const hasCC = candidate.tags.includes('Crowd Control');
  const hasPeel = candidate.tags.includes('Peel') || candidate.tags.includes('Disengage');
  const hasSustained = candidate.tags.includes('Sustained Damage');
  const hasPoke = candidate.tags.includes('Poke');

  const peelReason = zh ? '補強對抗敵方衝排的保排能力' : 'Adds peel against enemy dive';

  if (allies.length === 0) {
    allyScore = 62 + (candidate.blindPickSafety - 70) * 0.25;
    if (isFrontline) {
      fitReasons.push(zh ? '為隊伍建立穩健前排' : 'Establishes reliable frontline');
    }
    if (hasCC) {
      fitReasons.push(zh ? '提供泛用控制支援' : 'Brings flexible crowd control');
    }
    if (hasEngage) {
      fitReasons.push(zh ? '具備主動開戰節奏' : 'Offers proactive engage');
    }
  } else {
    // Damage balance synergy
    if (alliedProfile.physicalCount >= 2 && alliedProfile.magicCount === 0 && isMagic) {
      allyScore += 22;
      fitReasons.push(zh ? '補足急需的魔法傷害' : 'Adds needed magic damage');
    } else if (alliedProfile.magicCount >= 2 && alliedProfile.physicalCount === 0 && isPhysical) {
      allyScore += 22;
      fitReasons.push(zh ? '補足急需的物理傷害' : 'Adds needed physical damage');
    } else if (
      (alliedProfile.physicalCount >= 3 && isPhysical && !isMagic) ||
      (alliedProfile.magicCount >= 3 && isMagic && !isPhysical)
    ) {
      allyScore -= 16;
    } else if (isMagic && alliedProfile.magicCount <= 1) {
      allyScore += 8;
      fitReasons.push(zh ? '平衡隊伍魔法傷害比例' : 'Balances team magic damage');
    } else if (isPhysical && alliedProfile.physicalCount <= 1) {
      allyScore += 8;
      fitReasons.push(zh ? '平衡隊伍物理傷害比例' : 'Balances team physical damage');
    }

    // Frontline need
    if (alliedProfile.frontlineCount === 0 && isFrontline) {
      allyScore += 18;
      fitReasons.push(zh ? '補齊隊伍缺少的前排坦度' : 'Provides missing frontline');
    } else if (alliedProfile.frontlineCount === 1 && isFrontline) {
      allyScore += 7;
      fitReasons.push(zh ? '強化我方前排厚度' : 'Reinforces team frontline');
    }

    // Engage need
    if (alliedProfile.engageCount === 0 && hasEngage) {
      allyScore += 15;
      fitReasons.push(zh ? '擔綱隊伍主要開戰發起點' : 'Provides primary engage');
    } else if (hasEngage) {
      allyScore += 5;
      fitReasons.push(zh ? '提供二段接團與跟進開戰' : 'Adds follow-up engage');
    }

    // Crowd control
    if (alliedProfile.ccCount <= 1 && hasCC) {
      allyScore += 11;
      fitReasons.push(zh ? '補充穩定控制鏈' : 'Adds reliable crowd control');
    }

    // Peel for carries
    if (alliedProfile.peelCount === 0 && hasPeel && enemyProfile.diveThreatCount >= 1) {
      allyScore += 14;
      fitReasons.push(peelReason);
    }
  }

  // Enemy matchup & counter fit
  let enemyScore = 58;
  const risks: string[] = [];

  if (enemies.length > 0) {
    // Against heavy enemy dive
    if (enemyProfile.diveThreatCount >= 2) {
      if (hasPeel || hasCC) {
        enemyScore += 16;
        if (!fitReasons.includes(peelReason)) {
          fitReasons.push(zh ? '有效干擾敵方衝排進場' : 'Disrupts enemy dive threats');
        }
      } else if (candidate.blindPickSafety < 75 && !isFrontline) {
        enemyScore -= 15;
        risks.push(
          zh ? '面對敵方強衝排陣容較為脆弱' : 'Vulnerable to heavy enemy dive'
        );
      }
    }

    // Against heavy enemy frontline/tanks
    if (enemyProfile.frontlineCount >= 2) {
      if (hasSustained || candidate.tags.includes('Scaling')) {
        enemyScore += 13;
        fitReasons.push(
          zh ? '面對敵方雙前排具備優秀持續打坦能力' : 'Strong sustained damage into enemy frontline'
        );
      } else if (candidate.tags.includes('Burst') && !hasSustained) {
        enemyScore -= 8;
        risks.push(
          zh ? '純爆發傷害面對多坦克陣容較難打穿' : 'Burst damage can struggle into enemy tanks'
        );
      }
    }

    // Against heavy enemy CC
    if (enemyProfile.ccCount >= 2) {
      if (candidate.diveThreat >= 80 && !isFrontline) {
        enemyScore -= 12;
        risks.push(
          zh ? '敵方控制鏈充足，進場容錯較低' : 'Enemy composition has strong crowd control'
        );
      } else if (hasPoke || candidate.blindPickSafety >= 84) {
        enemyScore += 8;
      }
    }

    // Poke vs low engage enemy
    if (hasPoke && enemyProfile.engageCount === 0) {
      enemyScore += 10;
      fitReasons.push(
        zh ? '敵方缺乏強開，遠程消耗優勢顯著' : 'Strong range advantage into low-engage enemy draft'
      );
    }
  }

  if (risks.length === 0) {
    if (candidate.blindPickSafety < 66) {
      risks.push(
        zh
          ? '先選穩定度偏低，需留意對線康特風險'
          : 'Lower blind-pick safety; watch for lane counterpicks'
      );
    } else if (candidate.skillCeiling === 'High') {
      risks.push(
        zh
          ? '操作上限與失誤代價較高，需注意團戰切入時機'
          : 'Execution-sensitive kit under high pressure'
      );
    } else if (enemyProfile.ccCount >= 1) {
      risks.push(
        zh
          ? '交戰時需注意敵方關鍵控制技能冷卻'
          : 'Respect enemy crowd control timings in skirmishes'
      );
    } else {
      risks.push(
        zh ? '目前未偵測到明顯陣容弱點' : 'No major draft red flags detected'
      );
    }
  }

  const clampedAlly = Math.max(10, Math.min(100, Math.round(allyScore)));
  const clampedEnemy = Math.max(10, Math.min(100, Math.round(enemyScore)));

  const fitSummary =
    fitReasons.length > 0
      ? fitReasons.slice(0, 2).join(' · ')
      : isFrontline
        ? zh
          ? '穩固的前排支援能力'
          : 'Solid frontline presence'
        : hasPoke
          ? zh
            ? '穩定的對線壓制力'
            : 'Consistent lane pressure'
          : zh
            ? '均衡的分路功能貢獻'
            : 'Balanced role contribution';

  return {
    allyFitScore: clampedAlly,
    enemyFitScore: clampedEnemy,
    fitReasons: fitReasons.slice(0, 3),
    fitSummary,
    riskNote: risks[0],
  };
}

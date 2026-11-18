import {
  ROLES,
  type Applicant,
  type Bucket,
  type RankedApplicant,
  type RankingResult,
} from './types';

/**
 * Primer ordenamiento: baldes de vulnerabilidad según percentil RSH.
 * Luego, dentro de cada balde: cargo, necesidad formativa del Grupo y empate técnico.
 *
 * El percentil RSH se interpreta de 0 a 100, donde un valor menor representa
 * mayor vulnerabilidad socioeconómica.
 */
export function buildRanking(
  applicants: Applicant[],
  tolerance: number,
  minRatioDiff: number,
): RankingResult {
  if (applicants.length === 0) {
    return { ranked: [], buckets: [] };
  }

  const width = Math.max(0, tolerance);
  const ratioThreshold = Math.max(minRatioDiff, 1e-9);

  const sorted = [...applicants].sort(
    (a, b) => a.rsh - b.rsh || a.id.localeCompare(b.id),
  );

  const rawBuckets: Applicant[][] = [];
  for (const applicant of sorted) {
    const current = rawBuckets[rawBuckets.length - 1];
    if (!current) {
      rawBuckets.push([applicant]);
      continue;
    }
    const start = current[0].rsh;
    if (applicant.rsh === start || applicant.rsh - start < width) {
      current.push(applicant);
    } else {
      rawBuckets.push([applicant]);
    }
  }

  const ordered: RankedApplicant[] = [];

  rawBuckets.forEach((members, bucketIndex) => {
    for (const role of ROLES) {
      const sameRole = members
        .filter((applicant) => applicant.role === role)
        .sort(
          (a, b) =>
            a.groupRatio - b.groupRatio || a.id.localeCompare(b.id),
        );

      let cluster: Applicant[] = [];
      let clusterIndex = 0;

      const flush = () => {
        if (cluster.length === 0) return;
        const tieId =
          cluster.length > 1
            ? `tie-${bucketIndex}-${role}-${clusterIndex}`
            : null;

        if (tieId) {
          // Dentro de un empate técnico el orden es solo posicional.
          cluster.sort((a, b) => a.id.localeCompare(b.id));
        }

        for (const applicant of cluster) {
          ordered.push({
            applicant,
            position: 0,
            bucketIndex,
            tieId,
            tieSize: cluster.length,
          });
        }
        cluster = [];
        clusterIndex += 1;
      };

      for (const member of sameRole) {
        if (cluster.length === 0) {
          cluster = [member];
          continue;
        }
        const previous = cluster[cluster.length - 1];
        if (member.groupRatio - previous.groupRatio < ratioThreshold) {
          cluster.push(member);
        } else {
          flush();
          cluster = [member];
        }
      }
      flush();
    }
  });

  const ranked = ordered.map((item, index) => ({
    ...item,
    position: index + 1,
  }));

  const buckets: Bucket[] = rawBuckets.map((members, index) => {
    const bucketMembers = ranked.filter(
      (member) => member.bucketIndex === index,
    );
    return {
      index: index + 1,
      start: Math.min(...members.map((member) => member.rsh)),
      end: Math.max(...members.map((member) => member.rsh)),
      members: bucketMembers,
      hasTie: bucketMembers.some((member) => member.tieId !== null),
    };
  });

  return { ranked, buckets };
}

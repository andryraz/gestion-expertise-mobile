import type { ZoneTreeNode } from "@/types/zone";

export function findZoneNode(
  nodes: ZoneTreeNode[],
  zoneId: string,
): ZoneTreeNode | null {
  for (const node of nodes) {
    if (node.id === zoneId) return node;
    const found = findZoneNode(node.children, zoneId);
    if (found) return found;
  }
  return null;
}

export function collectDescendantIds(node: ZoneTreeNode): string[] {
  const ids: string[] = [];
  const walk = (children: ZoneTreeNode[]) => {
    for (const child of children) {
      ids.push(child.id);
      walk(child.children);
    }
  };
  walk(node.children);
  return ids;
}

export function countDescendants(node: ZoneTreeNode): number {
  return node.children.reduce(
    (acc, child) => acc + 1 + countDescendants(child),
    0,
  );
}

export function flattenTree(
  nodes: ZoneTreeNode[],
  depth = 0,
): { node: ZoneTreeNode; depth: number }[] {
  const result: { node: ZoneTreeNode; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    result.push(...flattenTree(node.children, depth + 1));
  }
  return result;
}

/**
 * Chaîne d'ancêtres de la zone (racine → cible), cible incluse. Sert à
 * libeller la source de la copie : path.length === 1 → zone racine (la
 * source est le bâtiment), sinon le parent est path[path.length - 2].
 * Récursion sans limite de profondeur (l'arbre lui-même est illimité).
 */
export function findZonePath(
  nodes: ZoneTreeNode[],
  zoneId: string,
): ZoneTreeNode[] {
  for (const node of nodes) {
    if (node.id === zoneId) return [node];
    const subPath = findZonePath(node.children, zoneId);
    if (subPath.length > 0) return [node, ...subPath];
  }
  return [];
}

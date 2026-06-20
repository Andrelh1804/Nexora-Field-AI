import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SkillLevel = "iniciante" | "intermediario" | "avancado" | "especialista";

export interface SelectedSkill {
  skillId: number;
  skillName: string;
  categoryName: string;
  categoryIcon: string;
  level: SkillLevel;
  yearsExperience: number;
}

interface SkillNode {
  id: number;
  name: string;
}
interface SubcategoryNode {
  id: number;
  name: string;
  skills: SkillNode[];
}
interface CategoryNode {
  id: number;
  name: string;
  icon: string;
  subcategories: SubcategoryNode[];
}

const LEVEL_LABELS: Record<SkillLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};
const LEVEL_COLORS: Record<SkillLevel, string> = {
  iniciante: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  intermediario: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avancado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  especialista: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface Props {
  value: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
  maxSkills?: number;
}

export function SpecialtySelector({ value, onChange, maxSkills = 30 }: Props) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());
  const [openSubs, setOpenSubs] = useState<Set<number>>(new Set());
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);

  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${apiBase}/api/specialties`)
      .then((r) => r.json())
      .then((data) => {
        setTree(data);
        // Auto-open first category
        if (data.length > 0) setOpenCats(new Set([data[0].id]));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiBase]);

  const selectedMap = useMemo(
    () => new Map(value.map((s) => [s.skillId, s])),
    [value]
  );

  // Filter tree by search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    return tree
      .map((cat) => ({
        ...cat,
        subcategories: cat.subcategories
          .map((sub) => ({
            ...sub,
            skills: sub.skills.filter(
              (sk) =>
                sk.name.toLowerCase().includes(q) ||
                sub.name.toLowerCase().includes(q) ||
                cat.name.toLowerCase().includes(q)
            ),
          }))
          .filter((sub) => sub.skills.length > 0),
      }))
      .filter((cat) => cat.subcategories.length > 0);
  }, [tree, search]);

  // Auto-open when searching
  useEffect(() => {
    if (search.trim()) {
      const catIds = new Set(filteredTree.map((c) => c.id));
      const subIds = new Set(
        filteredTree.flatMap((c) => c.subcategories.map((s) => s.id))
      );
      setOpenCats(catIds);
      setOpenSubs(subIds);
    }
  }, [search, filteredTree]);

  function toggleSkill(
    skill: SkillNode,
    cat: CategoryNode,
  ) {
    if (selectedMap.has(skill.id)) {
      onChange(value.filter((s) => s.skillId !== skill.id));
    } else {
      if (value.length >= maxSkills) return;
      onChange([
        ...value,
        {
          skillId: skill.id,
          skillName: skill.name,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          level: "intermediario",
          yearsExperience: 1,
        },
      ]);
    }
  }

  function updateLevel(skillId: number, level: SkillLevel) {
    onChange(value.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  }

  function updateYears(skillId: number, years: number) {
    onChange(value.map((s) => (s.skillId === skillId ? { ...s, yearsExperience: years } : s)));
  }

  function removeSkill(skillId: number) {
    onChange(value.filter((s) => s.skillId !== skillId));
    if (editingSkillId === skillId) setEditingSkillId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <span className="animate-pulse">Carregando especialidades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar skill, área ou tecnologia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selecionadas ({value.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {value.map((sk) => (
              <div key={sk.skillId} className="flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "cursor-pointer text-xs gap-1 pr-1 border",
                    editingSkillId === sk.skillId
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 hover:ring-primary/50",
                    LEVEL_COLORS[sk.level]
                  )}
                  onClick={() =>
                    setEditingSkillId(
                      editingSkillId === sk.skillId ? null : sk.skillId
                    )
                  }
                >
                  <span>{sk.categoryIcon}</span>
                  <span>{sk.skillName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSkill(sk.skillId);
                    }}
                    className="ml-0.5 rounded-full hover:bg-white/10 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            ))}
          </div>

          {/* Inline editor for selected skill */}
          {editingSkillId !== null && (() => {
            const sk = value.find((s) => s.skillId === editingSkillId);
            if (!sk) return null;
            return (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{sk.categoryIcon} {sk.skillName}</p>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingSkillId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nível</p>
                    <div className="flex flex-col gap-1">
                      {(Object.keys(LEVEL_LABELS) as SkillLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updateLevel(sk.skillId, lvl)}
                          className={cn(
                            "text-xs text-left px-2 py-1 rounded border transition-all",
                            sk.level === lvl
                              ? LEVEL_COLORS[lvl] + " border-current font-medium"
                              : "border-border hover:border-primary/30 text-muted-foreground"
                          )}
                        >
                          {sk.level === lvl && <Check className="inline h-3 w-3 mr-1" />}
                          {LEVEL_LABELS[lvl]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Anos de experiência</p>
                    <div className="flex flex-col gap-1">
                      {[0, 1, 2, 3, 5, 8, 10].map((y) => (
                        <button
                          key={y}
                          onClick={() => updateYears(sk.skillId, y)}
                          className={cn(
                            "text-xs text-left px-2 py-1 rounded border transition-all",
                            sk.yearsExperience === y
                              ? "bg-primary/20 text-primary border-primary/30 font-medium"
                              : "border-border hover:border-primary/30 text-muted-foreground"
                          )}
                        >
                          {y === 0 ? "< 1 ano" : `${y} ano${y !== 1 ? "s" : ""}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tree */}
      <ScrollArea className="h-[380px] pr-2">
        <div className="space-y-1">
          {filteredTree.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma especialidade encontrada para "{search}"
            </div>
          ) : (
            filteredTree.map((cat) => (
              <Collapsible
                key={cat.id}
                open={openCats.has(cat.id)}
                onOpenChange={(open) => {
                  const next = new Set(openCats);
                  open ? next.add(cat.id) : next.delete(cat.id);
                  setOpenCats(next);
                }}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted/50 text-left transition-colors group">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm font-semibold flex-1">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat.subcategories.reduce((s, sub) => s + sub.skills.filter(sk => selectedMap.has(sk.id)).length, 0) > 0 && (
                      <span className="mr-2 text-primary font-medium">
                        {cat.subcategories.reduce((s, sub) => s + sub.skills.filter(sk => selectedMap.has(sk.id)).length, 0)} selecionadas
                      </span>
                    )}
                  </span>
                  {openCats.has(cat.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-3 space-y-0.5 border-l border-border pl-3 mt-0.5 mb-1">
                    {cat.subcategories.map((sub) => (
                      <Collapsible
                        key={sub.id}
                        open={openSubs.has(sub.id)}
                        onOpenChange={(open) => {
                          const next = new Set(openSubs);
                          open ? next.add(sub.id) : next.delete(sub.id);
                          setOpenSubs(next);
                        }}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted/30 text-left transition-colors">
                          <span className="text-xs font-medium text-muted-foreground flex-1">
                            {sub.name}
                          </span>
                          {sub.skills.filter(sk => selectedMap.has(sk.id)).length > 0 && (
                            <span className="text-xs text-primary font-medium">
                              {sub.skills.filter(sk => selectedMap.has(sk.id)).length}✓
                            </span>
                          )}
                          {openSubs.has(sub.id) ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-2 py-1 flex flex-wrap gap-1.5">
                            {sub.skills.map((skill) => {
                              const selected = selectedMap.has(skill.id);
                              return (
                                <button
                                  key={skill.id}
                                  onClick={() => toggleSkill(skill, cat)}
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-full border transition-all",
                                    selected
                                      ? "bg-primary text-primary-foreground border-primary font-medium"
                                      : "border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground"
                                  )}
                                >
                                  {selected && <Check className="inline h-3 w-3 mr-1" />}
                                  {skill.name}
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      {value.length >= maxSkills && (
        <p className="text-xs text-orange-400 text-center">
          Limite de {maxSkills} especialidades atingido.
        </p>
      )}
    </div>
  );
}

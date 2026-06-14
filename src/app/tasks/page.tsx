"use client";

import { useTaskinoPageContext } from "../_components/taskino-context";
import type { TaskPeriod } from "../_lib/task-constants";

export default function TasksPage() {
  return <TasksPageContent />;
}

function TasksPageContent() {
  const {
    BarChart2, CalendarDays, CircleDashed, ClipboardList, FolderKanban, Plus, TrendingUp, UsersRound,    DragDropContext, Draggable, Droppable, AssigneeStack, COLUMNS, getId, formatDate, recurrenceLabel,    userName, currentUser, users, tasks, projects, taskQuery, managerStats, boardShowAll,    fixedTasks, managerTaskStatus, activeView, selectedPeriodFilter, setTaskQuery, setBoardShowAll, setActiveView, setSelectedPeriodFilter,    isManager, isSupervisor, isSpecialist, doneTasks, activeTasks, inProgressTasks, progress, statsUsers,    filteredFixedTemplates, openFixedTaskForm, onDragEnd
  } = useTaskinoPageContext();

  return (
    <>
{((!isSupervisor && (activeView === "dashboard" || activeView === "tasks")) || (isSupervisor && activeView === "tasks")) && (<>

          {/* Welcome banner */}
          <div className={`relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-lg ${isManager ? "bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-500 shadow-indigo-500/15" : "bg-gradient-to-l from-[#1a6b7c] via-[#1f7a8c] to-[#2491a5] shadow-[#1f7a8c]/15"}`}>
            <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 left-24 h-28 w-28 rounded-full bg-white/5" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">سلام، {userName(currentUser ?? undefined).split(" ")[0]}</p>
                <h1 className="mt-0.5 text-xl font-bold">{isManager ? "داشبورد مدیر" : "داشبورد گزارش‌ها"}</h1>
                <p className="mt-1 text-sm opacity-75">{isManager ? `${managerStats?.activeProjects ?? projects.length} پروژه فعال · ${managerStats?.activeUsers ?? users.length} کاربر` : activeTasks === 0 ? "همه گزارش‌ها تکمیل شده‌اند" : `${activeTasks} گزارش باز داری`}</p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                {isManager
                  ? [{ n: managerStats?.activeProjects ?? projects.length, l: "پروژه فعال" }, { n: managerStats?.openTasks ?? tasks.length, l: "گزارش باز" }, { n: managerStats?.activeUsers ?? users.length, l: "کاربر فعال" }].map((s: any, i: number) => (
                      <div key={i} className="text-center"><p className="text-2xl font-extrabold">{s.n}</p><p className="text-[11px] opacity-75">{s.l}</p></div>
                    ))
                  : [{ n: tasks.length, l: "کل گزارش" }, { n: projects.length, l: "پروژه" }, { n: `${progress}%`, l: "پیشرفت" }].map((s: any, i: number) => (
                      <div key={i} className="text-center"><p className="text-2xl font-extrabold">{s.n}</p><p className="text-[11px] opacity-75">{s.l}</p></div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {(isManager
              ? [
                  { label: "پروژه‌ها", value: tasks.length, sub: "پروژه", icon: FolderKanban, a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900", onClick: () => setActiveView("tasks-admin") },
                  { label: "گزارش‌های باز", value: managerStats?.openTasks ?? activeTasks, sub: `${inProgressTasks} جاری`, icon: ClipboardList, a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20", onClick: () => setActiveView("tasks") },
                  { label: "کاربران فعال", value: managerStats?.activeUsers ?? statsUsers, sub: "کاربر", icon: UsersRound, a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900", onClick: () => setActiveView("team") },
                  { label: "آنالیتیکس", value: managerTaskStatus?.doneTasks ?? managerTaskStatus?.done ?? doneTasks, sub: "گزارش تکمیل", icon: BarChart2, a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900", onClick: () => setActiveView("analytics") },
                ]
              : [
                  { label: "پروژه‌ها", value: tasks.length, sub: "واگذارشده", icon: FolderKanban, a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900", onClick: () => setActiveView("tasks-admin") },
                  { label: "گزارش‌های باز", value: activeTasks, sub: `${inProgressTasks} جاری`, icon: ClipboardList, a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20", onClick: undefined },
                  { label: "اعضای تیم", value: statsUsers, sub: "کاربر", icon: UsersRound, a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900", onClick: undefined },
                  { label: "تکمیل شده", value: doneTasks, sub: `${progress}% پیشرفت`, icon: TrendingUp, a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900", onClick: undefined },
                ]
            ).map((s: any) => (
              <div key={s.label} className={`group rounded-xl border border-[--border] bg-[--surface] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${s.onClick ? "cursor-pointer" : ""}`} onClick={s.onClick}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[--text-2]">{s.label}</p>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${s.a}`}><s.icon size={15} /></span>
                </div>
                <p className="mt-2.5 text-3xl font-bold">{s.value}</p>
                <p className="mt-0.5 text-xs text-[--text-3]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Manager: Pending leave requests on dashboard */}
          
{(activeView === "dashboard" || activeView === "tasks") && <div className="overflow-hidden rounded-2xl border border-[#b8dfe8] dark:border-[#1f5060] bg-[--surface] shadow-md shadow-[#1f7a8c]/8">
            <div className="flex flex-col gap-3 border-b border-[#cce8ef] dark:border-[#1f5060] bg-gradient-to-l from-[#e0f4f8] to-[#f0fafb] dark:from-[#0f2535] dark:to-[#0f172a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white shadow-sm shadow-[#1f7a8c]/20">
                  <ClipboardList size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-[--text]">برد گزارش‌ها</h2>
                  <p className="text-[11px] text-[--text-3]">
                    گزارش‌های ثابت بر اساس دوره · {fixedTasks.length} گزارش
                    {(() => { const od = fixedTasks.filter((f: any) => f.nextRunAt && new Date(f.nextRunAt) < new Date()).length; return od ? ` · ${od} مهلت‌گذشته` : ""; })()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-[--border] bg-[--surface] p-0.5 text-xs">
                  {([["", "همه"], ["daily", "روزانه"], ["weekly", "هفتگی"], ["monthly", "ماهانه"]] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      className={`rounded-md px-2.5 py-1 font-semibold transition ${selectedPeriodFilter === val ? "bg-[#1f7a8c] text-white" : "text-[--text-2] hover:bg-[--surface-2]"}`}
                      onClick={() => setSelectedPeriodFilter(val as TaskPeriod | "")} type="button"
                    >{lbl}</button>
                  ))}
                </div>
                <input
                  className="h-8 w-44 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c]"
                  placeholder="جستجوی گزارش…" value={taskQuery} onChange={(e) => setTaskQuery(e.target.value)}
                />
                {isManager && (
                  <button className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-3 text-xs font-semibold text-white transition hover:bg-[#196b7b]" onClick={() => { setActiveView("fixed-reports"); openFixedTaskForm(); }} type="button">
                    <Plus size={13} />گزارش ثابت جدید
                  </button>
                )}
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid gap-4 bg-[--surface-2]/40 p-4 lg:grid-cols-3">
                {COLUMNS.map((col: any) => {
                  const allItems = filteredFixedTemplates.filter((ft: any) => (ft.status ?? "todo") === col.status);
                  const items = boardShowAll ? allItems : allItems.slice(0, 8);
                  return (
                    <div key={col.status} className={`flex flex-col rounded-2xl border ${col.border} ${col.colBg}`}>
                      <div className={`flex items-center justify-between rounded-t-2xl bg-gradient-to-l ${col.headerGrad} px-4 py-3`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                          <h3 className={`text-sm font-bold ${col.headerText}`}>{col.title}</h3>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${col.badge}`}>{allItems.length}</span>
                      </div>
                      <Droppable droppableId={col.status} isDropDisabled={!isSpecialist}>
                        {(dropProvided: any, dropSnapshot: any) => (
                          <div
                            ref={dropProvided.innerRef}
                            {...dropProvided.droppableProps}
                            className={`flex flex-col gap-2.5 p-2.5 min-h-[120px] transition-colors ${dropSnapshot.isDraggingOver ? "bg-[#1f7a8c]/5" : ""}`}
                          >
                            {items.length === 0 ? (
                              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[--border] py-10">
                                <CircleDashed size={26} className="text-[--text-3] opacity-30" />
                                <p className="mt-2 text-xs text-[--text-3]">گزارشی نیست</p>
                              </div>
                            ) : items.map((ft: any, idx: number) => (
                              <Draggable key={getId(ft)} draggableId={getId(ft)} index={idx} isDragDisabled={!isSpecialist}>
                                {(dragProvided: any, dragSnapshot: any) => (
                                  <article
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={`rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 shadow-sm transition-all ${isManager ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""} ${isSpecialist ? "cursor-grab active:cursor-grabbing" : ""} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
                                    onClick={isManager ? () => { setActiveView("fixed-reports"); openFixedTaskForm(ft); } : undefined}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="rounded-md border border-[#b8dfe8] bg-[#e8f4f7] px-1.5 py-0.5 text-[10px] font-bold text-[#1f7a8c] dark:border-[#1f5060] dark:bg-[#0f3040] dark:text-[#4fc3d5]">ثابت · {recurrenceLabel(ft.recurrence)}</span>
                                      {ft.nextRunAt && new Date(ft.nextRunAt) < new Date()
                                        ? <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">مهلت گذشته</span>
                                        : <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ft.isActive !== false ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{ft.isActive !== false ? "فعال" : "غیرفعال"}</span>}
                                    </div>
                                    <div className="mt-2.5 flex items-start gap-2">
                                      <ClipboardList size={15} className="mt-0.5 shrink-0 text-[#1f7a8c]" />
                                      <h4 className="text-sm font-semibold leading-snug">{ft.title}</h4>
                                    </div>
                                    {ft.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">{ft.description}</p>}
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                      <AssigneeStack users={ft.assignedTo ? [ft.assignedTo] : []} />
                                      {ft.nextRunAt && (
                                        <div className="flex items-center gap-1 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] text-[--text-3]"><CalendarDays size={10} />{formatDate(ft.nextRunAt)}</div>
                                      )}
                                    </div>
                                  </article>
                                )}
                              </Draggable>
                            ))}
                            {dropProvided.placeholder}
                            {allItems.length > 8 && (
                              <button
                                className="mt-1 w-full rounded-lg border border-[--border] bg-[--surface-2] py-2 text-xs font-semibold text-[#1f7a8c] transition hover:bg-[--surface]"
                                onClick={() => setBoardShowAll((v: boolean) => !v)} type="button"
                              >
                                {boardShowAll ? "نمایش کمتر" : `نمایش بیشتر (${allItems.length - 8} مورد دیگر)`}
                              </button>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>}

          </>)}

    </>
  );
}

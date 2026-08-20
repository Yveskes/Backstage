import type { StaffDayId, StaffTaskId } from "@/lib/staff-tasks";

type TaskBriefing = {
  when: (days: StaffDayId | null) => string;
  tasks: string;
};

function festivalWhen(days: StaffDayId | null) {
  if (days === "friday") {
    return "Wees vrijdag om 16u op je post. Blijf tot je wordt afgelost.";
  }

  if (days === "saturday") {
    return "Wees zaterdag om 13u op je post. Blijf tot je wordt afgelost.";
  }

  if (days === "both") {
    return "Vrijdag om 16u op je post, zaterdag om 13u. Blijf tot je wordt afgelost.";
  }

  return "Je festivaldag is nog niet vastgelegd.";
}

const briefings: Record<string, TaskBriefing> = {
  opbouw: {
    when: () => "Wees om 9u op het terrein, aan de ingang. Reken tot 17u.",
    tasks:
      "Helpen met tenten, toog, stroom, hekken en de rest van het terrein. Trek stevige kleren en schoenen aan.",
  },
  afbouw: {
    when: () => "Wees om 10u op het terrein, aan de ingang. Reken tot 17u.",
    tasks: "Alles weer afbreken en opruimen: tenten, toog, materiaal en afval. Trek stevige kleren en schoenen aan.",
  },
  "toog-a": {
    when: festivalWhen,
    tasks: "Drank tappen, rekken bijvullen en de toog proper houden. Vragen? Bij de verantwoordelijke van de toog.",
  },
  "toog-b": {
    when: festivalWhen,
    tasks: "Drank tappen, rekken bijvullen en de toog proper houden. Vragen? Bij de verantwoordelijke van de toog.",
  },
  kassawagen: {
    when: festivalWhen,
    tasks: "Tickets en munten verkopen, wisselgeld kloppend houden en vragen van bezoekers beantwoorden.",
  },
  runner: {
    when: festivalWhen,
    tasks: "IJslopen tussen posten: drank, ijs, bekers en boodschappen brengen waar ze nodig zijn.",
  },
  ingang: {
    when: festivalWhen,
    tasks: "Mensen binnenlaten, tickets controleren en de rij in de gaten houden. Blijf beleefd maar duidelijk.",
  },
};

export function briefingForTask(taskId: StaffTaskId, label: string, days: StaffDayId | null) {
  const briefing = briefings[taskId];
  if (briefing) {
    return { when: briefing.when(days), tasks: briefing.tasks };
  }

  return {
    when: festivalWhen(days),
    tasks: `Je staat op ${label}. De verantwoordelijke van de post zegt ter plaatse wat er moet gebeuren.`,
  };
}

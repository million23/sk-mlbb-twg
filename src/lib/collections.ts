import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { getCollection } from "@/lib/pocketbase";
import { rateLimited } from "@/lib/rate-limited-api";
import { queryClient } from "@/lib/query-client";
import {
  withCreatedAuditFields,
  withUpdatedAuditField,
} from "@/lib/mutation-authors";
import { normalizeParticipantForCreate } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";

const PARTICIPANTS_ACTIVE_FILTER = "archived != true";
const TEAMS_ACTIVE_FILTER = "archived != true";
const TOURNAMENTS_ACTIVE_FILTER = "archived != true";

type Participant = Collections["participants"] & { id: string };
type Team = Collections["teams"] & { id: string };
type Tournament = Collections["tournaments"] & { id: string };

const refetchParticipants = () => {
  queryClient.invalidateQueries({ queryKey: ["participants"] });
  queryClient.invalidateQueries({ queryKey: ["participants", "archived"] });
  queryClient.invalidateQueries({ queryKey: ["team_suggestions"] });
  queryClient.invalidateQueries({ queryKey: ["draft_suggestions"] });
};
const refetchTeams = () => {
  queryClient.invalidateQueries({ queryKey: ["teams"] });
  queryClient.invalidateQueries({ queryKey: ["team_suggestions"] });
};
const refetchTournaments = () => {
  queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  queryClient.invalidateQueries({ queryKey: ["tournaments", "archived"] });
  queryClient.invalidateQueries({ queryKey: ["public", "upcoming"] });
  queryClient.invalidateQueries({ queryKey: ["public", "current"] });
  queryClient.invalidateQueries({ queryKey: ["draft_suggestions"] });
};

export const participantsCollection = createCollection(
  queryCollectionOptions<Participant>({
    id: "participants",
    queryKey: ["participants"],
    queryClient,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("participants");
        const list = await col.getFullList({
          sort: "-created",
          filter: PARTICIPANTS_ACTIVE_FILTER,
        });
        return list as Participant[];
      }),
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const { id: _id, ...rest } = m.modified as Record<string, unknown>;
        const payload = withCreatedAuditFields(
          normalizeParticipantForCreate(rest),
        );
        await rateLimited(() =>
          getCollection("participants").create(payload)
        );
      }
      refetchParticipants();
    },
    onUpdate: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await rateLimited(() =>
          getCollection("participants").update(
            m.key as string,
            withUpdatedAuditField(
              m.changes as Record<string, unknown>,
            ) as Record<string, unknown>,
          )
        );
      }
      refetchParticipants();
    },
    onDelete: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await rateLimited(() =>
          getCollection("participants").update(
            m.key as string,
            withUpdatedAuditField({
              archived: true,
              team: "",
              status: "unassigned",
            }),
          ),
        );
      }
      refetchParticipants();
    },
  })
);

export const teamsCollection = createCollection(
  queryCollectionOptions<Team>({
    id: "teams",
    queryKey: ["teams"],
    queryClient,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("teams");
        const list = await col.getFullList({
          sort: "-created",
          filter: TEAMS_ACTIVE_FILTER,
        });
        return list as Team[];
      }),
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const { id: _id, ...rest } = m.modified as Record<string, unknown>;
        await rateLimited(() =>
          getCollection("teams").create(withCreatedAuditFields(rest)),
        );
      }
      refetchTeams();
    },
    onUpdate: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await rateLimited(() =>
          getCollection("teams").update(
            m.key as string,
            withUpdatedAuditField(
              m.changes as Record<string, unknown>,
            ) as Record<string, unknown>,
          )
        );
      }
      refetchTeams();
    },
    onDelete: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const id = m.key as string;
        const participantsCol = getCollection("participants");
        const members = await rateLimited(() =>
          participantsCol.getFullList({ filter: `team = "${id}"` }),
        );
        for (const p of members) {
          await rateLimited(() =>
            participantsCol.update(
              p.id,
              withUpdatedAuditField({
                team: "",
                status: "unassigned",
              }),
            ),
          );
        }
        await rateLimited(() =>
          getCollection("teams").update(
            id,
            withUpdatedAuditField({ archived: true }),
          ),
        );
      }
      refetchTeams();
    },
  })
);

export const tournamentsCollection = createCollection(
  queryCollectionOptions<Tournament>({
    id: "tournaments",
    queryKey: ["tournaments"],
    queryClient,
    queryFn: () =>
      rateLimited(async () => {
        const col = getCollection("tournaments");
        const list = await col.getFullList({
          sort: "-created",
          filter: TOURNAMENTS_ACTIVE_FILTER,
        });
        return list as Tournament[];
      }),
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const { id: _id, ...rest } = m.modified as Record<string, unknown>;
        await rateLimited(() =>
          getCollection("tournaments").create(withCreatedAuditFields(rest)),
        );
      }
      refetchTournaments();
    },
    onUpdate: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await rateLimited(() =>
          getCollection("tournaments").update(
            m.key as string,
            withUpdatedAuditField(
              m.changes as Record<string, unknown>,
            ) as Record<string, unknown>,
          )
        );
      }
      refetchTournaments();
    },
    onDelete: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await rateLimited(() =>
          getCollection("tournaments").update(
            m.key as string,
            withUpdatedAuditField({ archived: true }),
          ),
        );
      }
      refetchTournaments();
    },
  })
);

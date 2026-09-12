# M14-Q raw evidence aggregation

Generated from retained JSON; milliseconds. Nearest-rank median/p95; p95 omitted below 20 samples. Each row stays in its own batch/phase. No failed timing is converted to zero. See the audit report for timing boundaries and exclusions.

## Storage operations

| Evidence / tier / reset | Operation | Phase | n | Median | p95 | Maximum | Failures |
| --- | --- | --- | --- | --- | --- | --- | --- |
| m14-q-storage-a.json / 0 / 0 | db-reopen | first invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | db-reopen | measured after declared warmups | 30 | 0.3 | 0.5 | 0.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | list | first invocation | 1 | 1.6 | — | 1.6 | 0 |
| m14-q-storage-a.json / 0 / 0 | list | measured after declared warmups | 30 | 0.1 | 0.2 | 0.8 | 0 |
| m14-q-storage-a.json / 0 / 0 | read | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | trigger-read | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | trigger-read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 0 | catalog | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | catalog | measured after declared warmups | 30 | 0.1 | 0.2 | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | create-delete | first invocation | 1 | 3.7 | — | 3.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | create-delete | measured after declared warmups | 30 | 1 | 1.5 | 2.3 | 0 |
| m14-q-storage-a.json / 0 / 0 | prompt | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | fake-provider | first invocation | 1 | 3.1 | — | 3.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | fake-provider | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | fingerprint | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0.1 | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | parser | first invocation | 1 | 2.7 | — | 2.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | parser | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | snapshot | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | snapshot | measured after declared warmups | 30 | 0.2 | 0.4 | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | stringify | first invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 0 | stringify | measured after declared warmups | 30 | 0 | 0 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | canonical-backup | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 0 / 0 | canonical-backup | measured after declared warmups | 30 | 0.3 | 0.4 | 0.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | parse-validate | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | parse-validate | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | prepare-import | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | prepare-import | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | atomic-restore | first invocation | 1 | 2.1 | — | 2.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | atomic-restore | measured after declared warmups | 30 | 1 | 1.4 | 1.5 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-common | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-common | measured after declared warmups | 30 | 0.2 | 0.5 | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-rare | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-rare | measured after declared warmups | 30 | 0.2 | 0.3 | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-none | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-missing-none | measured after declared warmups | 30 | 0.2 | 0.4 | 0.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-common | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-common | measured after declared warmups | 30 | 0.2 | 0.4 | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-rare | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-rare | measured after declared warmups | 30 | 0.2 | 0.3 | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-none | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-valid-none | measured after declared warmups | 30 | 0.2 | 0.5 | 0.7 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-common | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-common | measured after declared warmups | 30 | 0.2 | 0.3 | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-rare | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-rare | measured after declared warmups | 30 | 0.2 | 0.4 | 0.9 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-none | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 0 | retrieve-stale-none | measured after declared warmups | 30 | 0.2 | 0.3 | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 1 | db-reopen | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 0 / 1 | list | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | read | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 1 | catalog | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | create-delete | independent reset invocation | 1 | 2.6 | — | 2.6 | 0 |
| m14-q-storage-a.json / 0 / 1 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 1 | fake-provider | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 1 | fingerprint | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | parser | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 1 | snapshot | independent reset invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-a.json / 0 / 1 | stringify | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 1 | canonical-backup | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 1 | parse-validate | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 1 | prepare-import | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 1 | atomic-restore | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-missing-common | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-missing-rare | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-missing-none | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-valid-common | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-valid-rare | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-valid-none | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-stale-common | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-stale-rare | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 1 | retrieve-stale-none | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | db-reopen | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 0 / 2 | list | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 0 / 2 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 2 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 2 | catalog | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | create-delete | independent reset invocation | 1 | 2.5 | — | 2.5 | 0 |
| m14-q-storage-a.json / 0 / 2 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 2 | fake-provider | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 2 | fingerprint | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | parser | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 0 / 2 | snapshot | independent reset invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-a.json / 0 / 2 | stringify | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 2 | canonical-backup | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 0 / 2 | parse-validate | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 2 | prepare-import | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 2 | atomic-restore | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-missing-common | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-missing-rare | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-missing-none | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-valid-common | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-valid-rare | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-valid-none | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-stale-common | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-stale-rare | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 2 | retrieve-stale-none | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 3 | db-reopen | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 0 / 3 | list | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 3 | read | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 3 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 3 | catalog | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | create-delete | independent reset invocation | 1 | 3.9 | — | 3.9 | 0 |
| m14-q-storage-a.json / 0 / 3 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | fake-provider | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 3 | fingerprint | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 3 | parser | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 0 / 3 | snapshot | independent reset invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-a.json / 0 / 3 | stringify | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 3 | canonical-backup | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 3 | parse-validate | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 3 | prepare-import | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | atomic-restore | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-missing-common | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-missing-rare | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-missing-none | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-valid-common | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-valid-rare | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-valid-none | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-stale-common | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-stale-rare | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 3 | retrieve-stale-none | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | db-reopen | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 0 / 4 | list | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 4 | read | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 4 | trigger-read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | catalog | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | create-delete | independent reset invocation | 1 | 2.7 | — | 2.7 | 0 |
| m14-q-storage-a.json / 0 / 4 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 4 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 4 | fingerprint | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 4 | parser | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 4 | snapshot | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 0 / 4 | stringify | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 4 | canonical-backup | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 0 / 4 | parse-validate | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 0 / 4 | prepare-import | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 4 | atomic-restore | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-missing-common | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-missing-rare | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-missing-none | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-valid-common | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-valid-rare | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-valid-none | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-stale-common | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-stale-rare | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 0 / 4 | retrieve-stale-none | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | db-reopen | first invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | db-reopen | measured after declared warmups | 30 | 0.3 | 0.4 | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 0 | list | first invocation | 1 | 3 | — | 3 | 0 |
| m14-q-storage-a.json / 100 / 0 | list | measured after declared warmups | 30 | 1.3 | 1.7 | 1.8 | 0 |
| m14-q-storage-a.json / 100 / 0 | read | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | trigger-read | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 0 | trigger-read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | catalog | first invocation | 1 | 1.9 | — | 1.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | catalog | measured after declared warmups | 30 | 1.4 | 2.2 | 2.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | create-delete | first invocation | 1 | 3.5 | — | 3.5 | 0 |
| m14-q-storage-a.json / 100 / 0 | create-delete | measured after declared warmups | 30 | 2.5 | 3.8 | 3.8 | 0 |
| m14-q-storage-a.json / 100 / 0 | update | first invocation | 1 | 4.9 | — | 4.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | update | measured after declared warmups | 30 | 1.7 | 3.1 | 3.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | conditional-save | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | conditional-save | measured after declared warmups | 30 | 0.6 | 0.9 | 0.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | plan-by-id | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | plan-by-id | measured after declared warmups | 30 | 0.1 | 0.3 | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 0 | library-copy-fake-writer | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | library-copy-fake-writer | measured after declared warmups | 30 | 0.1 | 0.4 | 2 | 0 |
| m14-q-storage-a.json / 100 / 0 | coordinator-fake-writer | first invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 100 / 0 | coordinator-fake-writer | measured after declared warmups | 30 | 0.1 | 1.4 | 7.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | prompt | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | fake-provider | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | fake-provider | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | fingerprint | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | parser | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | parser | measured after declared warmups | 30 | 0 | 0 | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | snapshot | first invocation | 1 | 2.6 | — | 2.6 | 0 |
| m14-q-storage-a.json / 100 / 0 | snapshot | measured after declared warmups | 30 | 1.4 | 2 | 2.7 | 0 |
| m14-q-storage-a.json / 100 / 0 | stringify | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 0 | stringify | measured after declared warmups | 30 | 0.2 | 0.3 | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | canonical-backup | first invocation | 1 | 4.8 | — | 4.8 | 0 |
| m14-q-storage-a.json / 100 / 0 | canonical-backup | measured after declared warmups | 30 | 3.4 | 5.4 | 5.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | parse-validate | first invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 100 / 0 | parse-validate | measured after declared warmups | 30 | 0.8 | 1.2 | 2.7 | 0 |
| m14-q-storage-a.json / 100 / 0 | prepare-import | first invocation | 1 | 1.5 | — | 1.5 | 0 |
| m14-q-storage-a.json / 100 / 0 | prepare-import | measured after declared warmups | 30 | 1.3 | 1.6 | 1.6 | 0 |
| m14-q-storage-a.json / 100 / 0 | atomic-restore | first invocation | 1 | 13.8 | — | 13.8 | 0 |
| m14-q-storage-a.json / 100 / 0 | atomic-restore | measured after declared warmups | 30 | 13.6 | 47 | 50.7 | 0 |
| m14-q-storage-a.json / 100 / 0 | update-during-snapshot | first invocation | 1 | 8.1 | — | 8.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | update-during-snapshot | measured after declared warmups | 30 | 4 | 6.3 | 7.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-common | first invocation | 1 | 10.6 | — | 10.6 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-common | measured after declared warmups | 30 | 3.5 | 5.3 | 5.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-rare | first invocation | 1 | 3.6 | — | 3.6 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-rare | measured after declared warmups | 30 | 3.7 | 4.9 | 5.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-none | first invocation | 1 | 3.2 | — | 3.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-missing-none | measured after declared warmups | 30 | 3.5 | 11.8 | 12.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-common | first invocation | 1 | 16.4 | — | 16.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-common | measured after declared warmups | 30 | 5.5 | 8 | 8.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-rare | first invocation | 1 | 5.2 | — | 5.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-rare | measured after declared warmups | 30 | 5.4 | 10.5 | 13.9 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-none | first invocation | 1 | 5.1 | — | 5.1 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-valid-none | measured after declared warmups | 30 | 5.4 | 9.1 | 10.4 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-common | first invocation | 1 | 10.5 | — | 10.5 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-common | measured after declared warmups | 30 | 5.7 | 7.6 | 11 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-rare | first invocation | 1 | 5.2 | — | 5.2 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-rare | measured after declared warmups | 30 | 5.8 | 7.7 | 9 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-none | first invocation | 1 | 9 | — | 9 | 0 |
| m14-q-storage-a.json / 100 / 0 | retrieve-stale-none | measured after declared warmups | 30 | 7.9 | 12.2 | 12.8 | 0 |
| m14-q-storage-a.json / 100 / 1 | db-reopen | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | list | independent reset invocation | 1 | 2.8 | — | 2.8 | 0 |
| m14-q-storage-a.json / 100 / 1 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 1 | trigger-read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 1 | catalog | independent reset invocation | 1 | 5.5 | — | 5.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | create-delete | independent reset invocation | 1 | 5.5 | — | 5.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | update | independent reset invocation | 1 | 11 | — | 11 | 0 |
| m14-q-storage-a.json / 100 / 1 | conditional-save | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | plan-by-id | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | library-copy-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | coordinator-fake-writer | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 100 / 1 | prompt | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 1 | parser | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 100 / 1 | snapshot | independent reset invocation | 1 | 4.3 | — | 4.3 | 0 |
| m14-q-storage-a.json / 100 / 1 | stringify | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | canonical-backup | independent reset invocation | 1 | 9.1 | — | 9.1 | 0 |
| m14-q-storage-a.json / 100 / 1 | parse-validate | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 100 / 1 | prepare-import | independent reset invocation | 1 | 1.6 | — | 1.6 | 0 |
| m14-q-storage-a.json / 100 / 1 | atomic-restore | independent reset invocation | 1 | 18.8 | — | 18.8 | 0 |
| m14-q-storage-a.json / 100 / 1 | update-during-snapshot | independent reset invocation | 1 | 6.2 | — | 6.2 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-missing-common | independent reset invocation | 1 | 6.7 | — | 6.7 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-missing-rare | independent reset invocation | 1 | 3.7 | — | 3.7 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-missing-none | independent reset invocation | 1 | 4.5 | — | 4.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-valid-common | independent reset invocation | 1 | 12.1 | — | 12.1 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-valid-rare | independent reset invocation | 1 | 8.5 | — | 8.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-valid-none | independent reset invocation | 1 | 6.5 | — | 6.5 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-stale-common | independent reset invocation | 1 | 7.3 | — | 7.3 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-stale-rare | independent reset invocation | 1 | 6.4 | — | 6.4 | 0 |
| m14-q-storage-a.json / 100 / 1 | retrieve-stale-none | independent reset invocation | 1 | 5.6 | — | 5.6 | 0 |
| m14-q-storage-a.json / 100 / 2 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 100 / 2 | list | independent reset invocation | 1 | 2.4 | — | 2.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | trigger-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 2 | catalog | independent reset invocation | 1 | 2.9 | — | 2.9 | 0 |
| m14-q-storage-a.json / 100 / 2 | create-delete | independent reset invocation | 1 | 4.5 | — | 4.5 | 0 |
| m14-q-storage-a.json / 100 / 2 | update | independent reset invocation | 1 | 3.4 | — | 3.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | conditional-save | independent reset invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | plan-by-id | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | library-copy-fake-writer | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 2 | coordinator-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 2 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 2 | fake-provider | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | fingerprint | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 100 / 2 | parser | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 2 | snapshot | independent reset invocation | 1 | 24.3 | — | 24.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | stringify | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 100 / 2 | canonical-backup | independent reset invocation | 1 | 10.5 | — | 10.5 | 0 |
| m14-q-storage-a.json / 100 / 2 | parse-validate | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | prepare-import | independent reset invocation | 1 | 2.3 | — | 2.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | atomic-restore | independent reset invocation | 1 | 41 | — | 41 | 0 |
| m14-q-storage-a.json / 100 / 2 | update-during-snapshot | independent reset invocation | 1 | 7 | — | 7 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-missing-common | independent reset invocation | 1 | 7.5 | — | 7.5 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-missing-rare | independent reset invocation | 1 | 6.3 | — | 6.3 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-missing-none | independent reset invocation | 1 | 5.6 | — | 5.6 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-valid-common | independent reset invocation | 1 | 13.8 | — | 13.8 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-valid-rare | independent reset invocation | 1 | 6.4 | — | 6.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-valid-none | independent reset invocation | 1 | 6 | — | 6 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-stale-common | independent reset invocation | 1 | 10.6 | — | 10.6 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-stale-rare | independent reset invocation | 1 | 7.4 | — | 7.4 | 0 |
| m14-q-storage-a.json / 100 / 2 | retrieve-stale-none | independent reset invocation | 1 | 10.1 | — | 10.1 | 0 |
| m14-q-storage-a.json / 100 / 3 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 100 / 3 | list | independent reset invocation | 1 | 2.6 | — | 2.6 | 0 |
| m14-q-storage-a.json / 100 / 3 | read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | catalog | independent reset invocation | 1 | 3.4 | — | 3.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | create-delete | independent reset invocation | 1 | 5.7 | — | 5.7 | 0 |
| m14-q-storage-a.json / 100 / 3 | update | independent reset invocation | 1 | 4 | — | 4 | 0 |
| m14-q-storage-a.json / 100 / 3 | conditional-save | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | plan-by-id | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 3 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 3 | coordinator-fake-writer | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 100 / 3 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 3 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 3 | parser | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 3 | snapshot | independent reset invocation | 1 | 2.4 | — | 2.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | stringify | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 3 | canonical-backup | independent reset invocation | 1 | 5.1 | — | 5.1 | 0 |
| m14-q-storage-a.json / 100 / 3 | parse-validate | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 100 / 3 | prepare-import | independent reset invocation | 1 | 1.6 | — | 1.6 | 0 |
| m14-q-storage-a.json / 100 / 3 | atomic-restore | independent reset invocation | 1 | 16.4 | — | 16.4 | 0 |
| m14-q-storage-a.json / 100 / 3 | update-during-snapshot | independent reset invocation | 1 | 6.3 | — | 6.3 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-missing-common | independent reset invocation | 1 | 5.8 | — | 5.8 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-missing-rare | independent reset invocation | 1 | 3.5 | — | 3.5 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-missing-none | independent reset invocation | 1 | 3.3 | — | 3.3 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-valid-common | independent reset invocation | 1 | 10.1 | — | 10.1 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-valid-rare | independent reset invocation | 1 | 6.5 | — | 6.5 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-valid-none | independent reset invocation | 1 | 5.7 | — | 5.7 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-stale-common | independent reset invocation | 1 | 21 | — | 21 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-stale-rare | independent reset invocation | 1 | 5.9 | — | 5.9 | 0 |
| m14-q-storage-a.json / 100 / 3 | retrieve-stale-none | independent reset invocation | 1 | 7 | — | 7 | 0 |
| m14-q-storage-a.json / 100 / 4 | db-reopen | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | list | independent reset invocation | 1 | 2.7 | — | 2.7 | 0 |
| m14-q-storage-a.json / 100 / 4 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 4 | trigger-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 4 | catalog | independent reset invocation | 1 | 3.1 | — | 3.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | create-delete | independent reset invocation | 1 | 5.5 | — | 5.5 | 0 |
| m14-q-storage-a.json / 100 / 4 | update | independent reset invocation | 1 | 4.5 | — | 4.5 | 0 |
| m14-q-storage-a.json / 100 / 4 | conditional-save | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | plan-by-id | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 100 / 4 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 4 | coordinator-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 100 / 4 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 4 | fake-provider | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 100 / 4 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | parser | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 100 / 4 | snapshot | independent reset invocation | 1 | 2.9 | — | 2.9 | 0 |
| m14-q-storage-a.json / 100 / 4 | stringify | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 100 / 4 | canonical-backup | independent reset invocation | 1 | 4.9 | — | 4.9 | 0 |
| m14-q-storage-a.json / 100 / 4 | parse-validate | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | prepare-import | independent reset invocation | 1 | 1.8 | — | 1.8 | 0 |
| m14-q-storage-a.json / 100 / 4 | atomic-restore | independent reset invocation | 1 | 27.7 | — | 27.7 | 0 |
| m14-q-storage-a.json / 100 / 4 | update-during-snapshot | independent reset invocation | 1 | 6 | — | 6 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-missing-common | independent reset invocation | 1 | 6.6 | — | 6.6 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-missing-rare | independent reset invocation | 1 | 4.1 | — | 4.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-missing-none | independent reset invocation | 1 | 3.7 | — | 3.7 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-valid-common | independent reset invocation | 1 | 10.8 | — | 10.8 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-valid-rare | independent reset invocation | 1 | 6.1 | — | 6.1 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-valid-none | independent reset invocation | 1 | 5.3 | — | 5.3 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-stale-common | independent reset invocation | 1 | 6.5 | — | 6.5 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-stale-rare | independent reset invocation | 1 | 5.7 | — | 5.7 | 0 |
| m14-q-storage-a.json / 100 / 4 | retrieve-stale-none | independent reset invocation | 1 | 5.2 | — | 5.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | db-reopen | first invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | db-reopen | measured after declared warmups | 30 | 0.3 | 0.8 | 0.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | list | first invocation | 1 | 27.6 | — | 27.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | list | measured after declared warmups | 30 | 26.8 | 32.6 | 35.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | read | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | read | measured after declared warmups | 30 | 0.2 | 0.4 | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | trigger-read | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | trigger-read | measured after declared warmups | 30 | 0.2 | 0.3 | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 0 | catalog | first invocation | 1 | 28.4 | — | 28.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | catalog | measured after declared warmups | 30 | 29.9 | 40.6 | 43.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | create-delete | first invocation | 1 | 30.1 | — | 30.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | create-delete | measured after declared warmups | 30 | 25.9 | 36.5 | 40.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | update | first invocation | 1 | 33.9 | — | 33.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | update | measured after declared warmups | 30 | 27.6 | 43.7 | 50.8 | 0 |
| m14-q-storage-a.json / 1000 / 0 | conditional-save | first invocation | 1 | 1.8 | — | 1.8 | 0 |
| m14-q-storage-a.json / 1000 / 0 | conditional-save | measured after declared warmups | 30 | 0.9 | 1.3 | 1.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | plan-by-id | first invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 1000 / 0 | plan-by-id | measured after declared warmups | 30 | 0.3 | 0.5 | 0.5 | 0 |
| m14-q-storage-a.json / 1000 / 0 | library-copy-fake-writer | first invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | library-copy-fake-writer | measured after declared warmups | 30 | 0.3 | 3.7 | 9.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | coordinator-fake-writer | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | coordinator-fake-writer | measured after declared warmups | 30 | 0.3 | 0.7 | 10 | 0 |
| m14-q-storage-a.json / 1000 / 0 | prompt | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 1000 / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | fake-provider | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | fake-provider | measured after declared warmups | 30 | 0.1 | 0.1 | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | fingerprint | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | parser | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | parser | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | snapshot | first invocation | 1 | 33 | — | 33 | 0 |
| m14-q-storage-a.json / 1000 / 0 | snapshot | measured after declared warmups | 30 | 25.3 | 31 | 31.5 | 0 |
| m14-q-storage-a.json / 1000 / 0 | stringify | first invocation | 1 | 4 | — | 4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | stringify | measured after declared warmups | 30 | 3.9 | 8.3 | 9.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | canonical-backup | first invocation | 1 | 62.5 | — | 62.5 | 0 |
| m14-q-storage-a.json / 1000 / 0 | canonical-backup | measured after declared warmups | 30 | 62.1 | 100.8 | 105.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | parse-validate | first invocation | 1 | 13.3 | — | 13.3 | 0 |
| m14-q-storage-a.json / 1000 / 0 | parse-validate | measured after declared warmups | 30 | 12.5 | 19.1 | 28.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | prepare-import | first invocation | 1 | 26.5 | — | 26.5 | 0 |
| m14-q-storage-a.json / 1000 / 0 | prepare-import | measured after declared warmups | 30 | 26 | 37.1 | 38.3 | 0 |
| m14-q-storage-a.json / 1000 / 0 | atomic-restore | first invocation | 1 | 296.2 | — | 296.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | atomic-restore | measured after declared warmups | 30 | 906.5 | 1339.1 | 1364.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | update-during-snapshot | first invocation | 1 | 49 | — | 49 | 0 |
| m14-q-storage-a.json / 1000 / 0 | update-during-snapshot | measured after declared warmups | 30 | 32.2 | 45.5 | 50.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-common | first invocation | 1 | 39.1 | — | 39.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-common | measured after declared warmups | 30 | 31.9 | 34.2 | 35.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-rare | first invocation | 1 | 32.7 | — | 32.7 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-rare | measured after declared warmups | 30 | 31.9 | 33.9 | 34.7 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-none | first invocation | 1 | 33 | — | 33 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-missing-none | measured after declared warmups | 30 | 31.3 | 35.5 | 35.7 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-common | first invocation | 1 | 55.9 | — | 55.9 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-common | measured after declared warmups | 30 | 46.9 | 51.1 | 52.2 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-rare | first invocation | 1 | 45.6 | — | 45.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-rare | measured after declared warmups | 30 | 46.4 | 54 | 55.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-none | first invocation | 1 | 44.7 | — | 44.7 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-valid-none | measured after declared warmups | 30 | 43.9 | 46 | 48.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-common | first invocation | 1 | 47.4 | — | 47.4 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-common | measured after declared warmups | 30 | 43.7 | 46.9 | 48.6 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-rare | first invocation | 1 | 42.1 | — | 42.1 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-rare | measured after declared warmups | 30 | 44.7 | 48.1 | 48.3 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-none | first invocation | 1 | 44.3 | — | 44.3 | 0 |
| m14-q-storage-a.json / 1000 / 0 | retrieve-stale-none | measured after declared warmups | 30 | 44.9 | 47.9 | 48.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | db-reopen | independent reset invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-a.json / 1000 / 1 | list | independent reset invocation | 1 | 18.4 | — | 18.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | read | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 1 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | catalog | independent reset invocation | 1 | 20.9 | — | 20.9 | 0 |
| m14-q-storage-a.json / 1000 / 1 | create-delete | independent reset invocation | 1 | 17.6 | — | 17.6 | 0 |
| m14-q-storage-a.json / 1000 / 1 | update | independent reset invocation | 1 | 18.5 | — | 18.5 | 0 |
| m14-q-storage-a.json / 1000 / 1 | conditional-save | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 1000 / 1 | plan-by-id | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 1 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 1 | coordinator-fake-writer | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 1 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 1 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | fingerprint | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 1000 / 1 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 1 | snapshot | independent reset invocation | 1 | 15.4 | — | 15.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | stringify | independent reset invocation | 1 | 2.9 | — | 2.9 | 0 |
| m14-q-storage-a.json / 1000 / 1 | canonical-backup | independent reset invocation | 1 | 37.7 | — | 37.7 | 0 |
| m14-q-storage-a.json / 1000 / 1 | parse-validate | independent reset invocation | 1 | 7.5 | — | 7.5 | 0 |
| m14-q-storage-a.json / 1000 / 1 | prepare-import | independent reset invocation | 1 | 12.2 | — | 12.2 | 0 |
| m14-q-storage-a.json / 1000 / 1 | atomic-restore | independent reset invocation | 1 | 139.8 | — | 139.8 | 0 |
| m14-q-storage-a.json / 1000 / 1 | update-during-snapshot | independent reset invocation | 1 | 40.2 | — | 40.2 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-missing-common | independent reset invocation | 1 | 40 | — | 40 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-missing-rare | independent reset invocation | 1 | 34.4 | — | 34.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-missing-none | independent reset invocation | 1 | 28.4 | — | 28.4 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-valid-common | independent reset invocation | 1 | 58.3 | — | 58.3 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-valid-rare | independent reset invocation | 1 | 49.1 | — | 49.1 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-valid-none | independent reset invocation | 1 | 45.3 | — | 45.3 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-stale-common | independent reset invocation | 1 | 50.5 | — | 50.5 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-stale-rare | independent reset invocation | 1 | 48 | — | 48 | 0 |
| m14-q-storage-a.json / 1000 / 1 | retrieve-stale-none | independent reset invocation | 1 | 47.1 | — | 47.1 | 0 |
| m14-q-storage-a.json / 1000 / 2 | db-reopen | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 1000 / 2 | list | independent reset invocation | 1 | 18 | — | 18 | 0 |
| m14-q-storage-a.json / 1000 / 2 | read | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 2 | catalog | independent reset invocation | 1 | 21.7 | — | 21.7 | 0 |
| m14-q-storage-a.json / 1000 / 2 | create-delete | independent reset invocation | 1 | 18 | — | 18 | 0 |
| m14-q-storage-a.json / 1000 / 2 | update | independent reset invocation | 1 | 17.2 | — | 17.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | conditional-save | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 1000 / 2 | plan-by-id | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 2 | library-copy-fake-writer | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | coordinator-fake-writer | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 2 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | fake-provider | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 1000 / 2 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 2 | parser | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | snapshot | independent reset invocation | 1 | 17.5 | — | 17.5 | 0 |
| m14-q-storage-a.json / 1000 / 2 | stringify | independent reset invocation | 1 | 3 | — | 3 | 0 |
| m14-q-storage-a.json / 1000 / 2 | canonical-backup | independent reset invocation | 1 | 47.5 | — | 47.5 | 0 |
| m14-q-storage-a.json / 1000 / 2 | parse-validate | independent reset invocation | 1 | 8.2 | — | 8.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | prepare-import | independent reset invocation | 1 | 12.6 | — | 12.6 | 0 |
| m14-q-storage-a.json / 1000 / 2 | atomic-restore | independent reset invocation | 1 | 135.7 | — | 135.7 | 0 |
| m14-q-storage-a.json / 1000 / 2 | update-during-snapshot | independent reset invocation | 1 | 38.7 | — | 38.7 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-missing-common | independent reset invocation | 1 | 40.2 | — | 40.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-missing-rare | independent reset invocation | 1 | 34.3 | — | 34.3 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-missing-none | independent reset invocation | 1 | 31.8 | — | 31.8 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-valid-common | independent reset invocation | 1 | 57.2 | — | 57.2 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-valid-rare | independent reset invocation | 1 | 46.7 | — | 46.7 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-valid-none | independent reset invocation | 1 | 45.4 | — | 45.4 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-stale-common | independent reset invocation | 1 | 52.1 | — | 52.1 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-stale-rare | independent reset invocation | 1 | 46.7 | — | 46.7 | 0 |
| m14-q-storage-a.json / 1000 / 2 | retrieve-stale-none | independent reset invocation | 1 | 45.8 | — | 45.8 | 0 |
| m14-q-storage-a.json / 1000 / 3 | db-reopen | independent reset invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-a.json / 1000 / 3 | list | independent reset invocation | 1 | 18.4 | — | 18.4 | 0 |
| m14-q-storage-a.json / 1000 / 3 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | trigger-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 1000 / 3 | catalog | independent reset invocation | 1 | 20.6 | — | 20.6 | 0 |
| m14-q-storage-a.json / 1000 / 3 | create-delete | independent reset invocation | 1 | 19.3 | — | 19.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | update | independent reset invocation | 1 | 19.4 | — | 19.4 | 0 |
| m14-q-storage-a.json / 1000 / 3 | conditional-save | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 1000 / 3 | plan-by-id | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | coordinator-fake-writer | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 3 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 1000 / 3 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 3 | fingerprint | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 1000 / 3 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | snapshot | independent reset invocation | 1 | 14.9 | — | 14.9 | 0 |
| m14-q-storage-a.json / 1000 / 3 | stringify | independent reset invocation | 1 | 3.2 | — | 3.2 | 0 |
| m14-q-storage-a.json / 1000 / 3 | canonical-backup | independent reset invocation | 1 | 43 | — | 43 | 0 |
| m14-q-storage-a.json / 1000 / 3 | parse-validate | independent reset invocation | 1 | 7.4 | — | 7.4 | 0 |
| m14-q-storage-a.json / 1000 / 3 | prepare-import | independent reset invocation | 1 | 15.4 | — | 15.4 | 0 |
| m14-q-storage-a.json / 1000 / 3 | atomic-restore | independent reset invocation | 1 | 153.8 | — | 153.8 | 0 |
| m14-q-storage-a.json / 1000 / 3 | update-during-snapshot | independent reset invocation | 1 | 40.2 | — | 40.2 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-missing-common | independent reset invocation | 1 | 39.5 | — | 39.5 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-missing-rare | independent reset invocation | 1 | 35.2 | — | 35.2 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-missing-none | independent reset invocation | 1 | 34.8 | — | 34.8 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-valid-common | independent reset invocation | 1 | 59 | — | 59 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-valid-rare | independent reset invocation | 1 | 50.5 | — | 50.5 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-valid-none | independent reset invocation | 1 | 48.9 | — | 48.9 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-stale-common | independent reset invocation | 1 | 55.3 | — | 55.3 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-stale-rare | independent reset invocation | 1 | 50.5 | — | 50.5 | 0 |
| m14-q-storage-a.json / 1000 / 3 | retrieve-stale-none | independent reset invocation | 1 | 50.1 | — | 50.1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | db-reopen | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | list | independent reset invocation | 1 | 19.5 | — | 19.5 | 0 |
| m14-q-storage-a.json / 1000 / 4 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 4 | trigger-read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | catalog | independent reset invocation | 1 | 19.4 | — | 19.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | create-delete | independent reset invocation | 1 | 19 | — | 19 | 0 |
| m14-q-storage-a.json / 1000 / 4 | update | independent reset invocation | 1 | 19.3 | — | 19.3 | 0 |
| m14-q-storage-a.json / 1000 / 4 | conditional-save | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 1000 / 4 | plan-by-id | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 1000 / 4 | library-copy-fake-writer | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | coordinator-fake-writer | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 1000 / 4 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | fake-provider | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 1000 / 4 | snapshot | independent reset invocation | 1 | 16.9 | — | 16.9 | 0 |
| m14-q-storage-a.json / 1000 / 4 | stringify | independent reset invocation | 1 | 3.4 | — | 3.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | canonical-backup | independent reset invocation | 1 | 45.4 | — | 45.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | parse-validate | independent reset invocation | 1 | 8.7 | — | 8.7 | 0 |
| m14-q-storage-a.json / 1000 / 4 | prepare-import | independent reset invocation | 1 | 13.8 | — | 13.8 | 0 |
| m14-q-storage-a.json / 1000 / 4 | atomic-restore | independent reset invocation | 1 | 127.8 | — | 127.8 | 0 |
| m14-q-storage-a.json / 1000 / 4 | update-during-snapshot | independent reset invocation | 1 | 44 | — | 44 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-missing-common | independent reset invocation | 1 | 44.4 | — | 44.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-missing-rare | independent reset invocation | 1 | 39.1 | — | 39.1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-missing-none | independent reset invocation | 1 | 34 | — | 34 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-valid-common | independent reset invocation | 1 | 59.9 | — | 59.9 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-valid-rare | independent reset invocation | 1 | 48.1 | — | 48.1 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-valid-none | independent reset invocation | 1 | 48 | — | 48 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-stale-common | independent reset invocation | 1 | 53.9 | — | 53.9 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-stale-rare | independent reset invocation | 1 | 47.4 | — | 47.4 | 0 |
| m14-q-storage-a.json / 1000 / 4 | retrieve-stale-none | independent reset invocation | 1 | 46 | — | 46 | 0 |
| m14-q-storage-a.json / 10000 / 0 | db-reopen | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | db-reopen | measured after declared warmups | 10 | 0.3 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 0 | list | first invocation | 1 | 167.1 | — | 167.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | list | measured after declared warmups | 10 | 166.1 | — | 172.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | read | first invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 0 | read | measured after declared warmups | 10 | 0.2 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 0 | trigger-read | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | trigger-read | measured after declared warmups | 10 | 0.1 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | catalog | first invocation | 1 | 173.8 | — | 173.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | catalog | measured after declared warmups | 10 | 169.7 | — | 178.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | create-delete | first invocation | 1 | 129 | — | 129 | 0 |
| m14-q-storage-a.json / 10000 / 0 | create-delete | measured after declared warmups | 10 | 132 | — | 141.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | update | first invocation | 1 | 139.9 | — | 139.9 | 0 |
| m14-q-storage-a.json / 10000 / 0 | update | measured after declared warmups | 10 | 139.1 | — | 149.6 | 0 |
| m14-q-storage-a.json / 10000 / 0 | conditional-save | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | conditional-save | measured after declared warmups | 10 | 0.4 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | plan-by-id | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 0 | plan-by-id | measured after declared warmups | 10 | 0.1 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | library-copy-fake-writer | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 0 | library-copy-fake-writer | measured after declared warmups | 10 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | coordinator-fake-writer | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 0 | coordinator-fake-writer | measured after declared warmups | 10 | 0.1 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | prompt | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 0 | prompt | measured after declared warmups | 10 | 0 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | fake-provider | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | fake-provider | measured after declared warmups | 10 | 0.1 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | fingerprint | first invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 10000 / 0 | fingerprint | measured after declared warmups | 10 | 0 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | parser | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 0 | parser | measured after declared warmups | 10 | 0 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | snapshot | first invocation | 1 | 129.5 | — | 129.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | snapshot | measured after declared warmups | 10 | 133.2 | — | 146.9 | 0 |
| m14-q-storage-a.json / 10000 / 0 | stringify | first invocation | 1 | 39.1 | — | 39.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | stringify | measured after declared warmups | 10 | 29.5 | — | 36 | 0 |
| m14-q-storage-a.json / 10000 / 0 | canonical-backup | first invocation | 1 | 383.9 | — | 383.9 | 0 |
| m14-q-storage-a.json / 10000 / 0 | canonical-backup | measured after declared warmups | 10 | 652.8 | — | 782.2 | 0 |
| m14-q-storage-a.json / 10000 / 0 | parse-validate | first invocation | 1 | 182 | — | 182 | 0 |
| m14-q-storage-a.json / 10000 / 0 | parse-validate | measured after declared warmups | 10 | 150.5 | — | 230.6 | 0 |
| m14-q-storage-a.json / 10000 / 0 | prepare-import | first invocation | 1 | 234.8 | — | 234.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | prepare-import | measured after declared warmups | 10 | 279.7 | — | 314.7 | 0 |
| m14-q-storage-a.json / 10000 / 0 | atomic-restore | first invocation | 1 | 16694.6 | — | 16694.6 | 0 |
| m14-q-storage-a.json / 10000 / 0 | atomic-restore | measured after declared warmups | 10 | 27635.3 | — | 33905.4 | 0 |
| m14-q-storage-a.json / 10000 / 0 | update-during-snapshot | first invocation | 1 | 621.7 | — | 621.7 | 0 |
| m14-q-storage-a.json / 10000 / 0 | update-during-snapshot | measured after declared warmups | 10 | 513.2 | — | 609.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-common | first invocation | 1 | 721.9 | — | 721.9 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-common | measured after declared warmups | 10 | 690.1 | — | 781.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-rare | first invocation | 1 | 791.5 | — | 791.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-rare | measured after declared warmups | 10 | 657.7 | — | 737.3 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-none | first invocation | 1 | 763.5 | — | 763.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-missing-none | measured after declared warmups | 10 | 581.8 | — | 729.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-common | first invocation | 1 | 1002.5 | — | 1002.5 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-common | measured after declared warmups | 10 | 471.3 | — | 508.9 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-rare | first invocation | 1 | 475 | — | 475 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-rare | measured after declared warmups | 10 | 448 | — | 463.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-none | first invocation | 1 | 444.4 | — | 444.4 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-valid-none | measured after declared warmups | 10 | 437.1 | — | 469.8 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-common | first invocation | 1 | 513 | — | 513 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-common | measured after declared warmups | 10 | 428.5 | — | 462.1 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-rare | first invocation | 1 | 457 | — | 457 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-rare | measured after declared warmups | 10 | 436.7 | — | 469.7 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-none | first invocation | 1 | 418.7 | — | 418.7 | 0 |
| m14-q-storage-a.json / 10000 / 0 | retrieve-stale-none | measured after declared warmups | 10 | 431.8 | — | 445.7 | 0 |
| m14-q-storage-a.json / 10000 / 1 | db-reopen | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-a.json / 10000 / 1 | list | independent reset invocation | 1 | 194.4 | — | 194.4 | 0 |
| m14-q-storage-a.json / 10000 / 1 | read | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | trigger-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 1 | catalog | independent reset invocation | 1 | 200.1 | — | 200.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | create-delete | independent reset invocation | 1 | 159.9 | — | 159.9 | 0 |
| m14-q-storage-a.json / 10000 / 1 | update | independent reset invocation | 1 | 165.1 | — | 165.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | conditional-save | independent reset invocation | 1 | 2.3 | — | 2.3 | 0 |
| m14-q-storage-a.json / 10000 / 1 | plan-by-id | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-a.json / 10000 / 1 | library-copy-fake-writer | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | coordinator-fake-writer | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | prompt | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 1 | fake-provider | independent reset invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-a.json / 10000 / 1 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | parser | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 1 | snapshot | independent reset invocation | 1 | 156.6 | — | 156.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | stringify | independent reset invocation | 1 | 33.2 | — | 33.2 | 0 |
| m14-q-storage-a.json / 10000 / 1 | canonical-backup | independent reset invocation | 1 | 450.6 | — | 450.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | parse-validate | independent reset invocation | 1 | 102.9 | — | 102.9 | 0 |
| m14-q-storage-a.json / 10000 / 1 | prepare-import | independent reset invocation | 1 | 165.9 | — | 165.9 | 0 |
| m14-q-storage-a.json / 10000 / 1 | atomic-restore | independent reset invocation | 1 | 9335.6 | — | 9335.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | update-during-snapshot | independent reset invocation | 1 | 384.2 | — | 384.2 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-missing-common | independent reset invocation | 1 | 306.1 | — | 306.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-missing-rare | independent reset invocation | 1 | 295.3 | — | 295.3 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-missing-none | independent reset invocation | 1 | 314.6 | — | 314.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-valid-common | independent reset invocation | 1 | 539.7 | — | 539.7 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-valid-rare | independent reset invocation | 1 | 470.1 | — | 470.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-valid-none | independent reset invocation | 1 | 443.1 | — | 443.1 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-stale-common | independent reset invocation | 1 | 517.6 | — | 517.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-stale-rare | independent reset invocation | 1 | 457.6 | — | 457.6 | 0 |
| m14-q-storage-a.json / 10000 / 1 | retrieve-stale-none | independent reset invocation | 1 | 462.2 | — | 462.2 | 0 |
| m14-q-storage-a.json / 10000 / 2 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 10000 / 2 | list | independent reset invocation | 1 | 179.3 | — | 179.3 | 0 |
| m14-q-storage-a.json / 10000 / 2 | read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | trigger-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 2 | catalog | independent reset invocation | 1 | 174.3 | — | 174.3 | 0 |
| m14-q-storage-a.json / 10000 / 2 | create-delete | independent reset invocation | 1 | 131.1 | — | 131.1 | 0 |
| m14-q-storage-a.json / 10000 / 2 | update | independent reset invocation | 1 | 145.6 | — | 145.6 | 0 |
| m14-q-storage-a.json / 10000 / 2 | conditional-save | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-a.json / 10000 / 2 | plan-by-id | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 2 | coordinator-fake-writer | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 2 | prompt | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | fake-provider | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 2 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 2 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 2 | snapshot | independent reset invocation | 1 | 130.6 | — | 130.6 | 0 |
| m14-q-storage-a.json / 10000 / 2 | stringify | independent reset invocation | 1 | 31.4 | — | 31.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | canonical-backup | independent reset invocation | 1 | 390.7 | — | 390.7 | 0 |
| m14-q-storage-a.json / 10000 / 2 | parse-validate | independent reset invocation | 1 | 90.4 | — | 90.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | prepare-import | independent reset invocation | 1 | 130.5 | — | 130.5 | 0 |
| m14-q-storage-a.json / 10000 / 2 | atomic-restore | independent reset invocation | 1 | 8364.9 | — | 8364.9 | 0 |
| m14-q-storage-a.json / 10000 / 2 | update-during-snapshot | independent reset invocation | 1 | 394.7 | — | 394.7 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-missing-common | independent reset invocation | 1 | 307.2 | — | 307.2 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-missing-rare | independent reset invocation | 1 | 317.4 | — | 317.4 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-missing-none | independent reset invocation | 1 | 292.9 | — | 292.9 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-valid-common | independent reset invocation | 1 | 560.7 | — | 560.7 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-valid-rare | independent reset invocation | 1 | 469.7 | — | 469.7 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-valid-none | independent reset invocation | 1 | 472.1 | — | 472.1 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-stale-common | independent reset invocation | 1 | 523.1 | — | 523.1 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-stale-rare | independent reset invocation | 1 | 496.8 | — | 496.8 | 0 |
| m14-q-storage-a.json / 10000 / 2 | retrieve-stale-none | independent reset invocation | 1 | 477.9 | — | 477.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 10000 / 3 | list | independent reset invocation | 1 | 184.6 | — | 184.6 | 0 |
| m14-q-storage-a.json / 10000 / 3 | read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 3 | trigger-read | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 3 | catalog | independent reset invocation | 1 | 190.3 | — | 190.3 | 0 |
| m14-q-storage-a.json / 10000 / 3 | create-delete | independent reset invocation | 1 | 137.1 | — | 137.1 | 0 |
| m14-q-storage-a.json / 10000 / 3 | update | independent reset invocation | 1 | 145.8 | — | 145.8 | 0 |
| m14-q-storage-a.json / 10000 / 3 | conditional-save | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-a.json / 10000 / 3 | plan-by-id | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 3 | library-copy-fake-writer | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-a.json / 10000 / 3 | coordinator-fake-writer | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 3 | prompt | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 3 | fake-provider | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 3 | fingerprint | independent reset invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-a.json / 10000 / 3 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 3 | snapshot | independent reset invocation | 1 | 190.9 | — | 190.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | stringify | independent reset invocation | 1 | 63.1 | — | 63.1 | 0 |
| m14-q-storage-a.json / 10000 / 3 | canonical-backup | independent reset invocation | 1 | 611.6 | — | 611.6 | 0 |
| m14-q-storage-a.json / 10000 / 3 | parse-validate | independent reset invocation | 1 | 119.2 | — | 119.2 | 0 |
| m14-q-storage-a.json / 10000 / 3 | prepare-import | independent reset invocation | 1 | 207.5 | — | 207.5 | 0 |
| m14-q-storage-a.json / 10000 / 3 | atomic-restore | independent reset invocation | 1 | 9469.6 | — | 9469.6 | 0 |
| m14-q-storage-a.json / 10000 / 3 | update-during-snapshot | independent reset invocation | 1 | 431.1 | — | 431.1 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-missing-common | independent reset invocation | 1 | 376.9 | — | 376.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-missing-rare | independent reset invocation | 1 | 379.2 | — | 379.2 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-missing-none | independent reset invocation | 1 | 379.9 | — | 379.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-valid-common | independent reset invocation | 1 | 631.6 | — | 631.6 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-valid-rare | independent reset invocation | 1 | 520.9 | — | 520.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-valid-none | independent reset invocation | 1 | 503.5 | — | 503.5 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-stale-common | independent reset invocation | 1 | 544.9 | — | 544.9 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-stale-rare | independent reset invocation | 1 | 469.1 | — | 469.1 | 0 |
| m14-q-storage-a.json / 10000 / 3 | retrieve-stale-none | independent reset invocation | 1 | 449.6 | — | 449.6 | 0 |
| m14-q-storage-a.json / 10000 / 4 | db-reopen | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 10000 / 4 | list | independent reset invocation | 1 | 181.5 | — | 181.5 | 0 |
| m14-q-storage-a.json / 10000 / 4 | read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-a.json / 10000 / 4 | trigger-read | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 4 | catalog | independent reset invocation | 1 | 188.3 | — | 188.3 | 0 |
| m14-q-storage-a.json / 10000 / 4 | create-delete | independent reset invocation | 1 | 139.9 | — | 139.9 | 0 |
| m14-q-storage-a.json / 10000 / 4 | update | independent reset invocation | 1 | 141 | — | 141 | 0 |
| m14-q-storage-a.json / 10000 / 4 | conditional-save | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-a.json / 10000 / 4 | plan-by-id | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 4 | library-copy-fake-writer | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-a.json / 10000 / 4 | coordinator-fake-writer | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-a.json / 10000 / 4 | prompt | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 4 | fake-provider | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-a.json / 10000 / 4 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-a.json / 10000 / 4 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-a.json / 10000 / 4 | snapshot | independent reset invocation | 1 | 129.4 | — | 129.4 | 0 |
| m14-q-storage-a.json / 10000 / 4 | stringify | independent reset invocation | 1 | 29.4 | — | 29.4 | 0 |
| m14-q-storage-a.json / 10000 / 4 | canonical-backup | independent reset invocation | 1 | 377.6 | — | 377.6 | 0 |
| m14-q-storage-a.json / 10000 / 4 | parse-validate | independent reset invocation | 1 | 98.1 | — | 98.1 | 0 |
| m14-q-storage-a.json / 10000 / 4 | prepare-import | independent reset invocation | 1 | 148.7 | — | 148.7 | 0 |
| m14-q-storage-a.json / 10000 / 4 | atomic-restore | independent reset invocation | 1 | 8240.1 | — | 8240.1 | 0 |
| m14-q-storage-a.json / 10000 / 4 | update-during-snapshot | independent reset invocation | 1 | 381.9 | — | 381.9 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-missing-common | independent reset invocation | 1 | 317 | — | 317 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-missing-rare | independent reset invocation | 1 | 274.5 | — | 274.5 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-missing-none | independent reset invocation | 1 | 271.7 | — | 271.7 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-valid-common | independent reset invocation | 1 | 531.8 | — | 531.8 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-valid-rare | independent reset invocation | 1 | 445.2 | — | 445.2 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-valid-none | independent reset invocation | 1 | 459.8 | — | 459.8 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-stale-common | independent reset invocation | 1 | 517.5 | — | 517.5 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-stale-rare | independent reset invocation | 1 | 441.5 | — | 441.5 | 0 |
| m14-q-storage-a.json / 10000 / 4 | retrieve-stale-none | independent reset invocation | 1 | 474.7 | — | 474.7 | 0 |
| m14-q-storage-a.json / mixed / 0 | setup/later failure: Error: page.evaluate: BackupImportError: This isn't a valid AI Support Workspace backup file.
    at parseVersion7 (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:804:9)
    at parseBackupFile (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:940:10)
    at BackupV7CreationService.create (http://127.0.0.1:5173/src/application/backup/backup-service.ts:404:21)
    at async AuditSession.setup (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:175:17)
    at async globalThis.createM14QStorage (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:434:2)
    at async <anonymous>:329:30 | unavailable | 0 | — | — | — | 1 |
| m14-q-storage-a.json / mixed / 1 | setup/later failure: Error: page.evaluate: BackupImportError: This isn't a valid AI Support Workspace backup file.
    at parseVersion7 (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:804:9)
    at parseBackupFile (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:940:10)
    at BackupV7CreationService.create (http://127.0.0.1:5173/src/application/backup/backup-service.ts:404:21)
    at async AuditSession.setup (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:175:17)
    at async globalThis.createM14QStorage (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:434:2)
    at async <anonymous>:329:30 | unavailable | 0 | — | — | — | 1 |
| m14-q-storage-a.json / mixed / 2 | setup/later failure: Error: page.evaluate: BackupImportError: This isn't a valid AI Support Workspace backup file.
    at parseVersion7 (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:804:9)
    at parseBackupFile (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:940:10)
    at BackupV7CreationService.create (http://127.0.0.1:5173/src/application/backup/backup-service.ts:404:21)
    at async AuditSession.setup (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:175:17)
    at async globalThis.createM14QStorage (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:434:2)
    at async <anonymous>:329:30 | unavailable | 0 | — | — | — | 1 |
| m14-q-storage-a.json / mixed / 3 | setup/later failure: Error: page.evaluate: BackupImportError: This isn't a valid AI Support Workspace backup file.
    at parseVersion7 (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:804:9)
    at parseBackupFile (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:940:10)
    at BackupV7CreationService.create (http://127.0.0.1:5173/src/application/backup/backup-service.ts:404:21)
    at async AuditSession.setup (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:175:17)
    at async globalThis.createM14QStorage (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:434:2)
    at async <anonymous>:329:30 | unavailable | 0 | — | — | — | 1 |
| m14-q-storage-a.json / mixed / 4 | setup/later failure: Error: page.evaluate: BackupImportError: This isn't a valid AI Support Workspace backup file.
    at parseVersion7 (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:804:9)
    at parseBackupFile (http://127.0.0.1:5173/src/application/backup/backup-validator.ts:940:10)
    at BackupV7CreationService.create (http://127.0.0.1:5173/src/application/backup/backup-service.ts:404:21)
    at async AuditSession.setup (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:175:17)
    at async globalThis.createM14QStorage (http://127.0.0.1:5173/tests/performance/m14-q-storage.ts:434:2)
    at async <anonymous>:329:30 | unavailable | 0 | — | — | — | 1 |
| m14-q-storage-mapping.json / 10000 / 0 | restore-record-mapping | first invocation | 1 | 54.4 | — | 54.4 | 0 |
| m14-q-storage-mapping.json / 10000 / 0 | restore-record-mapping | measured after declared warmups | 30 | 34.5 | 48.9 | 54 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | db-reopen | first invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | db-reopen | measured after declared warmups | 30 | 0.3 | 0.4 | 0.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | list | first invocation | 1 | 18.7 | — | 18.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | list | measured after declared warmups | 10 | 18.4 | — | 19 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | read | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | trigger-read | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | trigger-read | measured after declared warmups | 30 | 0.2 | 3.4 | 6.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | catalog | first invocation | 1 | 19.2 | — | 19.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | catalog | measured after declared warmups | 10 | 18.2 | — | 19.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | create-delete | first invocation | 1 | 17.7 | — | 17.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | create-delete | measured after declared warmups | 10 | 17.5 | — | 27 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | update | first invocation | 1 | 16.9 | — | 16.9 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | update | measured after declared warmups | 10 | 16.4 | — | 18.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | conditional-save | first invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | conditional-save | measured after declared warmups | 30 | 0.4 | 0.5 | 0.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | plan-by-id | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | plan-by-id | measured after declared warmups | 30 | 0.2 | 0.3 | 2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | library-copy-fake-writer | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | library-copy-fake-writer | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | coordinator-fake-writer | first invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | coordinator-fake-writer | measured after declared warmups | 30 | 0.1 | 0.2 | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | asset-read | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | asset-read | measured after declared warmups | 10 | 0.1 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | prompt | first invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | fake-provider | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | fake-provider | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | fingerprint | first invocation | 1 | 0 | — | 0 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0 | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | parser | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | parser | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | snapshot | first invocation | 1 | 15.8 | — | 15.8 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | snapshot | measured after declared warmups | 10 | 16.6 | — | 18.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | stringify | first invocation | 1 | 7.2 | — | 7.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | stringify | measured after declared warmups | 30 | 7.3 | 9.7 | 10.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | canonical-backup | first invocation | 1 | 582.4 | — | 582.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | canonical-backup | measured after declared warmups | 10 | 507.7 | — | 687.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | parse-validate | first invocation | 1 | 345.5 | — | 345.5 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | parse-validate | measured after declared warmups | 10 | 338.9 | — | 417.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | prepare-import | first invocation | 1 | 340.7 | — | 340.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | prepare-import | measured after declared warmups | 10 | 329.4 | — | 426.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | atomic-restore | first invocation | 1 | 498.6 | — | 498.6 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | atomic-restore | measured after declared warmups | 10 | 704 | — | 909.1 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | update-during-snapshot | first invocation | 1 | 44.8 | — | 44.8 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | update-during-snapshot | measured after declared warmups | 10 | 28.9 | — | 36.6 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-common | first invocation | 1 | 33 | — | 33 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-common | measured after declared warmups | 30 | 32.4 | 38 | 38.3 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-rare | first invocation | 1 | 36 | — | 36 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-rare | measured after declared warmups | 30 | 32.9 | 37.5 | 37.8 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-none | first invocation | 1 | 32.8 | — | 32.8 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-missing-none | measured after declared warmups | 30 | 59 | 75.1 | 78.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-common | first invocation | 1 | 103.9 | — | 103.9 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-common | measured after declared warmups | 30 | 112.4 | 153.3 | 160.9 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-rare | first invocation | 1 | 94.2 | — | 94.2 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-rare | measured after declared warmups | 30 | 90.7 | 155.3 | 158.4 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-none | first invocation | 1 | 100.7 | — | 100.7 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-valid-none | measured after declared warmups | 30 | 109.6 | 141.4 | 147.3 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-common | first invocation | 1 | 92.9 | — | 92.9 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-common | measured after declared warmups | 30 | 105.5 | 133.2 | 133.3 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-rare | first invocation | 1 | 115 | — | 115 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-rare | measured after declared warmups | 30 | 103.3 | 146.6 | 173.8 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-none | first invocation | 1 | 99 | — | 99 | 0 |
| m14-q-storage-mixed.json / mixed / 0 | retrieve-stale-none | measured after declared warmups | 30 | 100.4 | 139.3 | 142.4 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | list | independent reset invocation | 1 | 25.6 | — | 25.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | trigger-read | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | catalog | independent reset invocation | 1 | 28.1 | — | 28.1 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | create-delete | independent reset invocation | 1 | 24.5 | — | 24.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | update | independent reset invocation | 1 | 22.8 | — | 22.8 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | conditional-save | independent reset invocation | 1 | 1.5 | — | 1.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | plan-by-id | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | library-copy-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | coordinator-fake-writer | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | asset-read | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | fake-provider | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | fingerprint | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | parser | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | snapshot | independent reset invocation | 1 | 21.5 | — | 21.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | stringify | independent reset invocation | 1 | 7.4 | — | 7.4 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | canonical-backup | independent reset invocation | 1 | 486.9 | — | 486.9 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | parse-validate | independent reset invocation | 1 | 322.1 | — | 322.1 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | prepare-import | independent reset invocation | 1 | 327.4 | — | 327.4 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | atomic-restore | independent reset invocation | 1 | 529.8 | — | 529.8 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | update-during-snapshot | independent reset invocation | 1 | 64.5 | — | 64.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-missing-common | independent reset invocation | 1 | 68.5 | — | 68.5 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-missing-rare | independent reset invocation | 1 | 55.3 | — | 55.3 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-missing-none | independent reset invocation | 1 | 58.6 | — | 58.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-valid-common | independent reset invocation | 1 | 103.7 | — | 103.7 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-valid-rare | independent reset invocation | 1 | 86.7 | — | 86.7 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-valid-none | independent reset invocation | 1 | 87.6 | — | 87.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-stale-common | independent reset invocation | 1 | 90.6 | — | 90.6 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-stale-rare | independent reset invocation | 1 | 104.1 | — | 104.1 | 0 |
| m14-q-storage-mixed.json / mixed / 1 | retrieve-stale-none | independent reset invocation | 1 | 88.5 | — | 88.5 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | list | independent reset invocation | 1 | 34.6 | — | 34.6 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | trigger-read | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | catalog | independent reset invocation | 1 | 33.3 | — | 33.3 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | create-delete | independent reset invocation | 1 | 29.6 | — | 29.6 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | update | independent reset invocation | 1 | 31.4 | — | 31.4 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | conditional-save | independent reset invocation | 1 | 3 | — | 3 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | plan-by-id | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | library-copy-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | coordinator-fake-writer | independent reset invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | asset-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | fake-provider | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | fingerprint | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | snapshot | independent reset invocation | 1 | 24.3 | — | 24.3 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | stringify | independent reset invocation | 1 | 9 | — | 9 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | canonical-backup | independent reset invocation | 1 | 493.3 | — | 493.3 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | parse-validate | independent reset invocation | 1 | 325.9 | — | 325.9 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | prepare-import | independent reset invocation | 1 | 336.1 | — | 336.1 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | atomic-restore | independent reset invocation | 1 | 521.8 | — | 521.8 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | update-during-snapshot | independent reset invocation | 1 | 69.6 | — | 69.6 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-missing-common | independent reset invocation | 1 | 72.2 | — | 72.2 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-missing-rare | independent reset invocation | 1 | 59.4 | — | 59.4 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-missing-none | independent reset invocation | 1 | 55.7 | — | 55.7 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-valid-common | independent reset invocation | 1 | 103.9 | — | 103.9 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-valid-rare | independent reset invocation | 1 | 86.2 | — | 86.2 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-valid-none | independent reset invocation | 1 | 92 | — | 92 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-stale-common | independent reset invocation | 1 | 90.8 | — | 90.8 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-stale-rare | independent reset invocation | 1 | 84.8 | — | 84.8 | 0 |
| m14-q-storage-mixed.json / mixed / 2 | retrieve-stale-none | independent reset invocation | 1 | 87.1 | — | 87.1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | db-reopen | independent reset invocation | 1 | 1 | — | 1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | list | independent reset invocation | 1 | 33.3 | — | 33.3 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | read | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | trigger-read | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | catalog | independent reset invocation | 1 | 29.9 | — | 29.9 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | create-delete | independent reset invocation | 1 | 26.1 | — | 26.1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | update | independent reset invocation | 1 | 30 | — | 30 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | conditional-save | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | plan-by-id | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | library-copy-fake-writer | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | coordinator-fake-writer | independent reset invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | asset-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | prompt | independent reset invocation | 1 | 0.2 | — | 0.2 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | fake-provider | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | snapshot | independent reset invocation | 1 | 24.2 | — | 24.2 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | stringify | independent reset invocation | 1 | 8.3 | — | 8.3 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | canonical-backup | independent reset invocation | 1 | 493.4 | — | 493.4 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | parse-validate | independent reset invocation | 1 | 320.3 | — | 320.3 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | prepare-import | independent reset invocation | 1 | 318.5 | — | 318.5 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | atomic-restore | independent reset invocation | 1 | 551.6 | — | 551.6 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | update-during-snapshot | independent reset invocation | 1 | 63.1 | — | 63.1 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-missing-common | independent reset invocation | 1 | 68.6 | — | 68.6 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-missing-rare | independent reset invocation | 1 | 54 | — | 54 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-missing-none | independent reset invocation | 1 | 65.7 | — | 65.7 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-valid-common | independent reset invocation | 1 | 107.2 | — | 107.2 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-valid-rare | independent reset invocation | 1 | 101.4 | — | 101.4 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-valid-none | independent reset invocation | 1 | 101.7 | — | 101.7 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-stale-common | independent reset invocation | 1 | 92.4 | — | 92.4 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-stale-rare | independent reset invocation | 1 | 94.8 | — | 94.8 | 0 |
| m14-q-storage-mixed.json / mixed / 3 | retrieve-stale-none | independent reset invocation | 1 | 91.3 | — | 91.3 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | db-reopen | independent reset invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | list | independent reset invocation | 1 | 29.2 | — | 29.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | read | independent reset invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | trigger-read | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | catalog | independent reset invocation | 1 | 30.6 | — | 30.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | create-delete | independent reset invocation | 1 | 27.5 | — | 27.5 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | update | independent reset invocation | 1 | 25.6 | — | 25.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | conditional-save | independent reset invocation | 1 | 1.4 | — | 1.4 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | plan-by-id | independent reset invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | library-copy-fake-writer | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | coordinator-fake-writer | independent reset invocation | 1 | 0.7 | — | 0.7 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | asset-read | independent reset invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | prompt | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | fake-provider | independent reset invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | fingerprint | independent reset invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | parser | independent reset invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | snapshot | independent reset invocation | 1 | 19.7 | — | 19.7 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | stringify | independent reset invocation | 1 | 6.5 | — | 6.5 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | canonical-backup | independent reset invocation | 1 | 483.2 | — | 483.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | parse-validate | independent reset invocation | 1 | 319.2 | — | 319.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | prepare-import | independent reset invocation | 1 | 325.7 | — | 325.7 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | atomic-restore | independent reset invocation | 1 | 522.8 | — | 522.8 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | update-during-snapshot | independent reset invocation | 1 | 60.6 | — | 60.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-missing-common | independent reset invocation | 1 | 65.8 | — | 65.8 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-missing-rare | independent reset invocation | 1 | 57 | — | 57 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-missing-none | independent reset invocation | 1 | 58.6 | — | 58.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-valid-common | independent reset invocation | 1 | 99.9 | — | 99.9 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-valid-rare | independent reset invocation | 1 | 88.6 | — | 88.6 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-valid-none | independent reset invocation | 1 | 86.2 | — | 86.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-stale-common | independent reset invocation | 1 | 93.7 | — | 93.7 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-stale-rare | independent reset invocation | 1 | 91.2 | — | 91.2 | 0 |
| m14-q-storage-mixed.json / mixed / 4 | retrieve-stale-none | independent reset invocation | 1 | 88.6 | — | 88.6 | 0 |
| m14-q-storage-near.json / near / 0 | snapshot | measured after declared warmups | 3 | 63.6 | — | 72.7 | 0 |
| m14-q-storage-near.json / near / 0 | stringify | measured after declared warmups | 3 | 48.6 | — | 48.6 | 0 |
| m14-q-storage-near.json / near / 0 | canonical-backup | measured after declared warmups | 3 | 530.1 | — | 1076.3 | 0 |
| m14-q-storage-near.json / near / 0 | parse-validate | measured after declared warmups | 3 | 36.3 | — | 44.1 | 0 |
| m14-q-storage-near.json / near / 0 | prepare-import | measured after declared warmups | 3 | 343 | — | 400.3 | 0 |
| m14-q-storage-near.json / near / 0 | atomic-restore | measured after declared warmups | 3 | 118 | — | 126 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | db-reopen | first invocation | 1 | 1.2 | — | 1.2 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | db-reopen | measured after declared warmups | 30 | 0.3 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | list | first invocation | 1 | 18.9 | — | 18.9 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | list | measured after declared warmups | 30 | 18.6 | 20.7 | 32 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | read | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | read | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | trigger-read | first invocation | 1 | 0.4 | — | 0.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | trigger-read | measured after declared warmups | 30 | 0.1 | 0.3 | 0.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | catalog | first invocation | 1 | 18.5 | — | 18.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | catalog | measured after declared warmups | 30 | 18.4 | 19.8 | 22.9 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | create-delete | first invocation | 1 | 22.1 | — | 22.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | create-delete | measured after declared warmups | 30 | 16.1 | 27.3 | 28.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | update | first invocation | 1 | 16.7 | — | 16.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | update | measured after declared warmups | 30 | 17.6 | 26.8 | 34.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | conditional-save | first invocation | 1 | 6 | — | 6 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | conditional-save | measured after declared warmups | 30 | 0.8 | 1.2 | 1.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | plan-by-id | first invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | plan-by-id | measured after declared warmups | 30 | 0.3 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | library-copy-fake-writer | first invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | library-copy-fake-writer | measured after declared warmups | 30 | 0.3 | 0.5 | 0.6 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | coordinator-fake-writer | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | coordinator-fake-writer | measured after declared warmups | 30 | 0.3 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | prompt | first invocation | 1 | 0.3 | — | 0.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | fake-provider | first invocation | 1 | 5.7 | — | 5.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | fake-provider | measured after declared warmups | 30 | 0.1 | 0.2 | 0.2 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | fingerprint | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | parser | first invocation | 1 | 2.8 | — | 2.8 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | parser | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | snapshot | first invocation | 1 | 25.7 | — | 25.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | snapshot | measured after declared warmups | 30 | 26 | 32.3 | 33.6 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | stringify | first invocation | 1 | 4.4 | — | 4.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | stringify | measured after declared warmups | 30 | 4.7 | 7 | 8.9 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | canonical-backup | first invocation | 1 | 63.1 | — | 63.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | canonical-backup | measured after declared warmups | 30 | 65.4 | 74.9 | 76 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | parse-validate | first invocation | 1 | 13.9 | — | 13.9 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | parse-validate | measured after declared warmups | 30 | 13.4 | 18 | 19 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | prepare-import | first invocation | 1 | 21.5 | — | 21.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | prepare-import | measured after declared warmups | 30 | 21 | 28.1 | 28.8 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | atomic-restore | first invocation | 1 | 247.5 | — | 247.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | atomic-restore | measured after declared warmups | 30 | 1638.6 | 2798.3 | 3097.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | update-during-snapshot | first invocation | 1 | 69.1 | — | 69.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | update-during-snapshot | measured after declared warmups | 30 | 75.2 | 96.4 | 98.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-common | first invocation | 1 | 128.3 | — | 128.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-common | measured after declared warmups | 30 | 91.1 | 129.5 | 138.1 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-rare | first invocation | 1 | 92.3 | — | 92.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-rare | measured after declared warmups | 30 | 112.3 | 149.4 | 150.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-none | first invocation | 1 | 121.3 | — | 121.3 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-stale-none | measured after declared warmups | 30 | 111.4 | 153 | 155.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-common | first invocation | 1 | 99 | — | 99 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-common | measured after declared warmups | 30 | 107.9 | 138.5 | 139.6 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-rare | first invocation | 1 | 103.7 | — | 103.7 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-rare | measured after declared warmups | 30 | 116.8 | 144.3 | 165.8 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-none | first invocation | 1 | 82.2 | — | 82.2 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-valid-none | measured after declared warmups | 30 | 96.6 | 128.5 | 133 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-common | first invocation | 1 | 73.6 | — | 73.6 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-common | measured after declared warmups | 30 | 68.3 | 100.8 | 101 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-rare | first invocation | 1 | 72.4 | — | 72.4 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-rare | measured after declared warmups | 30 | 82.9 | 105.2 | 105.9 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-none | first invocation | 1 | 101.5 | — | 101.5 | 0 |
| m14-q-storage-repeat.json / 1000 / 0 | retrieve-missing-none | measured after declared warmups | 30 | 82.4 | 104.8 | 105.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | db-reopen | first invocation | 1 | 3.7 | — | 3.7 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | db-reopen | measured after declared warmups | 30 | 1.1 | 2.6 | 3.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | list | first invocation | 1 | 355.7 | — | 355.7 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | list | measured after declared warmups | 3 | 345.6 | — | 380.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | read | first invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | read | measured after declared warmups | 30 | 0.2 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | trigger-read | first invocation | 1 | 0.9 | — | 0.9 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | trigger-read | measured after declared warmups | 30 | 0.3 | 0.4 | 0.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | catalog | first invocation | 1 | 452 | — | 452 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | catalog | measured after declared warmups | 3 | 401.5 | — | 405.9 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | create-delete | first invocation | 1 | 258.6 | — | 258.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | create-delete | measured after declared warmups | 3 | 230.3 | — | 244.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | update | first invocation | 1 | 256 | — | 256 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | update | measured after declared warmups | 3 | 225 | — | 245.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | conditional-save | first invocation | 1 | 2.1 | — | 2.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | conditional-save | measured after declared warmups | 30 | 0.9 | 1.4 | 1.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | plan-by-id | first invocation | 1 | 0.8 | — | 0.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | plan-by-id | measured after declared warmups | 30 | 0.2 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | library-copy-fake-writer | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | library-copy-fake-writer | measured after declared warmups | 30 | 0.3 | 0.4 | 0.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | coordinator-fake-writer | first invocation | 1 | 1.3 | — | 1.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | coordinator-fake-writer | measured after declared warmups | 30 | 0.3 | 0.4 | 0.4 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | prompt | first invocation | 1 | 0.6 | — | 0.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | prompt | measured after declared warmups | 30 | 0 | 0.1 | 0.2 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | fake-provider | first invocation | 1 | 1.1 | — | 1.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | fake-provider | measured after declared warmups | 30 | 0.1 | 0.2 | 0.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | fingerprint | first invocation | 1 | 0.1 | — | 0.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | fingerprint | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | parser | first invocation | 1 | 0.5 | — | 0.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | parser | measured after declared warmups | 30 | 0 | 0.1 | 0.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | snapshot | first invocation | 1 | 226.3 | — | 226.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | snapshot | measured after declared warmups | 3 | 267.1 | — | 269.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | stringify | first invocation | 1 | 56.3 | — | 56.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | stringify | measured after declared warmups | 30 | 46.3 | 66.9 | 74.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | canonical-backup | first invocation | 1 | 606.6 | — | 606.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | canonical-backup | measured after declared warmups | 3 | 626.7 | — | 627.7 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | parse-validate | first invocation | 1 | 154 | — | 154 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | parse-validate | measured after declared warmups | 3 | 145.7 | — | 153.9 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | prepare-import | first invocation | 1 | 222.2 | — | 222.2 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | prepare-import | measured after declared warmups | 3 | 225.2 | — | 268.7 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | atomic-restore | first invocation | 1 | 16858.7 | — | 16858.7 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | atomic-restore | measured after declared warmups | 3 | 26015.1 | — | 30899.9 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | update-during-snapshot | first invocation | 1 | 729.6 | — | 729.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | update-during-snapshot | measured after declared warmups | 3 | 540.1 | — | 621 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-common | first invocation | 1 | 1019.2 | — | 1019.2 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-common | measured after declared warmups | 3 | 1063.6 | — | 1172.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-rare | first invocation | 1 | 1037.5 | — | 1037.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-rare | measured after declared warmups | 3 | 1003.2 | — | 1097.1 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-none | first invocation | 1 | 999.5 | — | 999.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-stale-none | measured after declared warmups | 3 | 886.1 | — | 889.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-common | first invocation | 1 | 1179.6 | — | 1179.6 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-common | measured after declared warmups | 3 | 956.5 | — | 1074.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-rare | first invocation | 1 | 922.8 | — | 922.8 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-rare | measured after declared warmups | 3 | 1078.7 | — | 1109.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-none | first invocation | 1 | 1128.2 | — | 1128.2 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-valid-none | measured after declared warmups | 3 | 1048.3 | — | 1085.9 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-common | first invocation | 1 | 802.5 | — | 802.5 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-common | measured after declared warmups | 3 | 719.2 | — | 754.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-rare | first invocation | 1 | 692.3 | — | 692.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-rare | measured after declared warmups | 3 | 654 | — | 739.3 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-none | first invocation | 1 | 697 | — | 697 | 0 |
| m14-q-storage-repeat.json / 10000 / 0 | retrieve-missing-none | measured after declared warmups | 3 | 565.1 | — | 623.1 | 0 |

## Delivery A/B

| Evidence | Path | Phase | n | Median | p95 | Maximum |
| --- | --- | --- | --- | --- | --- | --- |
| m14-q-delivery-a.json | text/plainSerialization | five fresh-context first calls | 5 | 0.3 | — | 0.5 |
| m14-q-delivery-a.json | text/plainSerialization | warm first context | 30 | 0 | 0 | 0.1 |
| m14-q-delivery-a.json | text/richSerialization | five fresh-context first calls | 5 | 0.1 | — | 0.3 |
| m14-q-delivery-a.json | text/richSerialization | warm first context | 30 | 0 | 0.2 | 0.6 |
| m14-q-delivery-a.json | text/planner | five fresh-context first calls | 5 | 0 | — | 0.1 |
| m14-q-delivery-a.json | text/planner | warm first context | 30 | 0 | 0.1 | 0.1 |
| m14-q-delivery-a.json | images/image/png/0/planner | five fresh-context first calls | 5 | 0.5 | — | 0.6 |
| m14-q-delivery-a.json | images/image/png/0/planner | warm first context | 24 | 0.3 | 0.5 | 0.6 |
| m14-q-delivery-a.json | images/image/png/0/preparation | five fresh-context first calls | 5 | 0.5 | — | 0.5 |
| m14-q-delivery-a.json | images/image/png/0/preparation | warm first context | 12 | 0.1 | — | 0.2 |
| m14-q-delivery-a.json | images/image/png/0/plannerAndPreparation | five fresh-context first calls | 5 | 0.7 | — | 1 |
| m14-q-delivery-a.json | images/image/png/0/plannerAndPreparation | warm first context | 12 | 0.3 | — | 0.4 |
| m14-q-delivery-a.json | images/image/png/1/planner | five fresh-context first calls | 5 | 2.2 | — | 3.6 |
| m14-q-delivery-a.json | images/image/png/1/planner | warm first context | 12 | 2.1 | — | 3 |
| m14-q-delivery-a.json | images/image/png/1/preparation | five fresh-context first calls | 5 | 1.6 | — | 1.8 |
| m14-q-delivery-a.json | images/image/png/1/preparation | warm first context | 6 | 1.1 | — | 1.6 |
| m14-q-delivery-a.json | images/image/png/1/plannerAndPreparation | five fresh-context first calls | 5 | 3.9 | — | 4.7 |
| m14-q-delivery-a.json | images/image/png/1/plannerAndPreparation | warm first context | 6 | 3.2 | — | 4.1 |
| m14-q-delivery-a.json | images/image/png/2/planner | five fresh-context first calls | 5 | 5.8 | — | 6.6 |
| m14-q-delivery-a.json | images/image/png/2/planner | warm first context | 12 | 5.6 | — | 7 |
| m14-q-delivery-a.json | images/image/png/2/preparation | five fresh-context first calls | 5 | 2.8 | — | 3.7 |
| m14-q-delivery-a.json | images/image/png/2/preparation | warm first context | 6 | 2.9 | — | 3.1 |
| m14-q-delivery-a.json | images/image/png/2/plannerAndPreparation | five fresh-context first calls | 5 | 9.1 | — | 10.2 |
| m14-q-delivery-a.json | images/image/png/2/plannerAndPreparation | warm first context | 6 | 8.7 | — | 10.1 |
| m14-q-delivery-a.json | images/image/jpeg/0/planner | five fresh-context first calls | 5 | 0.4 | — | 0.4 |
| m14-q-delivery-a.json | images/image/jpeg/0/planner | warm first context | 24 | 0.3 | 0.6 | 0.7 |
| m14-q-delivery-a.json | images/image/jpeg/0/preparation | five fresh-context first calls | 5 | 15.8 | — | 17.5 |
| m14-q-delivery-a.json | images/image/jpeg/0/preparation | warm first context | 12 | 17 | — | 17.8 |
| m14-q-delivery-a.json | images/image/jpeg/0/plannerAndPreparation | five fresh-context first calls | 5 | 16.3 | — | 18.6 |
| m14-q-delivery-a.json | images/image/jpeg/0/plannerAndPreparation | warm first context | 12 | 16.5 | — | 17.8 |
| m14-q-delivery-a.json | images/image/jpeg/1/planner | five fresh-context first calls | 5 | 0.7 | — | 0.9 |
| m14-q-delivery-a.json | images/image/jpeg/1/planner | warm first context | 12 | 0.9 | — | 2.1 |
| m14-q-delivery-a.json | images/image/jpeg/1/preparation | five fresh-context first calls | 5 | 28.5 | — | 32.3 |
| m14-q-delivery-a.json | images/image/jpeg/1/preparation | warm first context | 6 | 17 | — | 37.6 |
| m14-q-delivery-a.json | images/image/jpeg/1/plannerAndPreparation | five fresh-context first calls | 5 | 24.2 | — | 34 |
| m14-q-delivery-a.json | images/image/jpeg/1/plannerAndPreparation | warm first context | 6 | 18.3 | — | 34 |
| m14-q-delivery-a.json | images/image/jpeg/2/planner | five fresh-context first calls | 5 | 2.3 | — | 3.1 |
| m14-q-delivery-a.json | images/image/jpeg/2/planner | warm first context | 12 | 2.3 | — | 3.5 |
| m14-q-delivery-a.json | images/image/jpeg/2/preparation | five fresh-context first calls | 5 | 81.3 | — | 86.3 |
| m14-q-delivery-a.json | images/image/jpeg/2/preparation | warm first context | 6 | 73.5 | — | 88.3 |
| m14-q-delivery-a.json | images/image/jpeg/2/plannerAndPreparation | five fresh-context first calls | 5 | 86.7 | — | 90.9 |
| m14-q-delivery-a.json | images/image/jpeg/2/plannerAndPreparation | warm first context | 6 | 85 | — | 114.3 |
| m14-q-delivery-a.json | images/image/webp/0/planner | five fresh-context first calls | 5 | 0.3 | — | 0.5 |
| m14-q-delivery-a.json | images/image/webp/0/planner | warm first context | 24 | 0.4 | 0.6 | 4.8 |
| m14-q-delivery-a.json | images/image/webp/0/preparation | five fresh-context first calls | 5 | 9.6 | — | 19.7 |
| m14-q-delivery-a.json | images/image/webp/0/preparation | warm first context | 12 | 16.3 | — | 18.8 |
| m14-q-delivery-a.json | images/image/webp/0/plannerAndPreparation | five fresh-context first calls | 5 | 16.7 | — | 17.6 |
| m14-q-delivery-a.json | images/image/webp/0/plannerAndPreparation | warm first context | 12 | 16.7 | — | 17.3 |
| m14-q-delivery-a.json | images/image/webp/1/planner | five fresh-context first calls | 5 | 1.3 | — | 2.6 |
| m14-q-delivery-a.json | images/image/webp/1/planner | warm first context | 12 | 0.9 | — | 1.4 |
| m14-q-delivery-a.json | images/image/webp/1/preparation | five fresh-context first calls | 5 | 42.4 | — | 44.5 |
| m14-q-delivery-a.json | images/image/webp/1/preparation | warm first context | 6 | 38.9 | — | 69.6 |
| m14-q-delivery-a.json | images/image/webp/1/plannerAndPreparation | five fresh-context first calls | 5 | 34.7 | — | 55.7 |
| m14-q-delivery-a.json | images/image/webp/1/plannerAndPreparation | warm first context | 6 | 33.6 | — | 52.9 |
| m14-q-delivery-a.json | images/image/webp/2/planner | five fresh-context first calls | 5 | 2.4 | — | 3.9 |
| m14-q-delivery-a.json | images/image/webp/2/planner | warm first context | 12 | 2.2 | — | 3.3 |
| m14-q-delivery-a.json | images/image/webp/2/preparation | five fresh-context first calls | 5 | 134 | — | 145.9 |
| m14-q-delivery-a.json | images/image/webp/2/preparation | warm first context | 6 | 121 | — | 137.6 |
| m14-q-delivery-a.json | images/image/webp/2/plannerAndPreparation | five fresh-context first calls | 5 | 131.1 | — | 144.5 |
| m14-q-delivery-a.json | images/image/webp/2/plannerAndPreparation | warm first context | 6 | 125.5 | — | 154.8 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacySmallPng | five fresh-context first calls | 5 | 0.4 | — | 0.6 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacySmallPng | warm first context | 15 | 0.3 | — | 0.5 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacyMediumPng | five fresh-context first calls | 5 | 28.5 | — | 31.8 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacyMediumPng | warm first context | 8 | 25.8 | — | 30.4 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacyLargePng | five fresh-context first calls | 5 | 106.9 | — | 115.5 |
| m14-q-delivery-a.json | nativeRequestPreparation/legacyLargePng | warm first context | 6 | 115.2 | — | 169.1 |
| m14-q-delivery-a.json | nativeRequestPreparation/smallPng | five fresh-context first calls | 5 | 0.1 | — | 0.2 |
| m14-q-delivery-a.json | nativeRequestPreparation/smallPng | warm first context | 15 | 0 | — | 0.2 |
| m14-q-delivery-a.json | nativeRequestPreparation/mediumPng | five fresh-context first calls | 5 | 0.4 | — | 0.5 |
| m14-q-delivery-a.json | nativeRequestPreparation/mediumPng | warm first context | 8 | 0.3 | — | 0.3 |
| m14-q-delivery-a.json | nativeRequestPreparation/largePng | five fresh-context first calls | 5 | 1.3 | — | 2.2 |
| m14-q-delivery-a.json | nativeRequestPreparation/largePng | warm first context | 6 | 2 | — | 4 |
| m14-q-delivery-a.json | nativeRequestPreparation/automaticPasteMessages | five fresh-context first calls | 5 | 0.1 | — | 0.1 |
| m14-q-delivery-a.json | nativeRequestPreparation/automaticPasteMessages | warm first context | 30 | 0 | 0.1 | 0.1 |
| m14-q-delivery-b.json | text/plainSerialization | five fresh-context first calls | 5 | 0.2 | — | 0.3 |
| m14-q-delivery-b.json | text/plainSerialization | warm first context | 30 | 0 | 0 | 0 |
| m14-q-delivery-b.json | text/richSerialization | five fresh-context first calls | 5 | 0.1 | — | 0.2 |
| m14-q-delivery-b.json | text/richSerialization | warm first context | 30 | 0 | 0 | 0.1 |
| m14-q-delivery-b.json | text/planner | five fresh-context first calls | 5 | 0 | — | 0.2 |
| m14-q-delivery-b.json | text/planner | warm first context | 30 | 0 | 0 | 0.1 |
| m14-q-delivery-b.json | images/image/png/0/planner | five fresh-context first calls | 5 | 0.3 | — | 0.7 |
| m14-q-delivery-b.json | images/image/png/0/planner | warm first context | 24 | 0.2 | 0.3 | 0.3 |
| m14-q-delivery-b.json | images/image/png/0/preparation | five fresh-context first calls | 5 | 0.3 | — | 0.5 |
| m14-q-delivery-b.json | images/image/png/0/preparation | warm first context | 12 | 0.1 | — | 0.3 |
| m14-q-delivery-b.json | images/image/png/0/plannerAndPreparation | five fresh-context first calls | 5 | 0.6 | — | 0.9 |
| m14-q-delivery-b.json | images/image/png/0/plannerAndPreparation | warm first context | 12 | 0.4 | — | 0.6 |
| m14-q-delivery-b.json | images/image/png/1/planner | five fresh-context first calls | 5 | 2 | — | 2.9 |
| m14-q-delivery-b.json | images/image/png/1/planner | warm first context | 12 | 2 | — | 2.2 |
| m14-q-delivery-b.json | images/image/png/1/preparation | five fresh-context first calls | 5 | 1.1 | — | 1.7 |
| m14-q-delivery-b.json | images/image/png/1/preparation | warm first context | 6 | 1.1 | — | 1.3 |
| m14-q-delivery-b.json | images/image/png/1/plannerAndPreparation | five fresh-context first calls | 5 | 3.6 | — | 5.3 |
| m14-q-delivery-b.json | images/image/png/1/plannerAndPreparation | warm first context | 6 | 2.8 | — | 3.3 |
| m14-q-delivery-b.json | images/image/png/2/planner | five fresh-context first calls | 5 | 4.9 | — | 6.6 |
| m14-q-delivery-b.json | images/image/png/2/planner | warm first context | 12 | 4.8 | — | 5.1 |
| m14-q-delivery-b.json | images/image/png/2/preparation | five fresh-context first calls | 5 | 2.7 | — | 4 |
| m14-q-delivery-b.json | images/image/png/2/preparation | warm first context | 6 | 2.7 | — | 3 |
| m14-q-delivery-b.json | images/image/png/2/plannerAndPreparation | five fresh-context first calls | 5 | 9.2 | — | 11.3 |
| m14-q-delivery-b.json | images/image/png/2/plannerAndPreparation | warm first context | 6 | 7.9 | — | 8.4 |
| m14-q-delivery-b.json | images/image/jpeg/0/planner | five fresh-context first calls | 5 | 0.4 | — | 0.5 |
| m14-q-delivery-b.json | images/image/jpeg/0/planner | warm first context | 24 | 0.2 | 0.4 | 0.6 |
| m14-q-delivery-b.json | images/image/jpeg/0/preparation | five fresh-context first calls | 5 | 10.9 | — | 16.9 |
| m14-q-delivery-b.json | images/image/jpeg/0/preparation | warm first context | 12 | 16.6 | — | 17.9 |
| m14-q-delivery-b.json | images/image/jpeg/0/plannerAndPreparation | five fresh-context first calls | 5 | 16.6 | — | 17.9 |
| m14-q-delivery-b.json | images/image/jpeg/0/plannerAndPreparation | warm first context | 12 | 16.3 | — | 17.9 |
| m14-q-delivery-b.json | images/image/jpeg/1/planner | five fresh-context first calls | 5 | 1.1 | — | 1.2 |
| m14-q-delivery-b.json | images/image/jpeg/1/planner | warm first context | 12 | 0.7 | — | 1.4 |
| m14-q-delivery-b.json | images/image/jpeg/1/preparation | five fresh-context first calls | 5 | 24.3 | — | 26.2 |
| m14-q-delivery-b.json | images/image/jpeg/1/preparation | warm first context | 6 | 32.4 | — | 37.9 |
| m14-q-delivery-b.json | images/image/jpeg/1/plannerAndPreparation | five fresh-context first calls | 5 | 32.5 | — | 37.7 |
| m14-q-delivery-b.json | images/image/jpeg/1/plannerAndPreparation | warm first context | 6 | 32.5 | — | 37.1 |
| m14-q-delivery-b.json | images/image/jpeg/2/planner | five fresh-context first calls | 5 | 3.2 | — | 3.4 |
| m14-q-delivery-b.json | images/image/jpeg/2/planner | warm first context | 12 | 2.5 | — | 3.4 |
| m14-q-delivery-b.json | images/image/jpeg/2/preparation | five fresh-context first calls | 5 | 80.1 | — | 98 |
| m14-q-delivery-b.json | images/image/jpeg/2/preparation | warm first context | 6 | 80.3 | — | 82 |
| m14-q-delivery-b.json | images/image/jpeg/2/plannerAndPreparation | five fresh-context first calls | 5 | 80.8 | — | 83.2 |
| m14-q-delivery-b.json | images/image/jpeg/2/plannerAndPreparation | warm first context | 6 | 79.1 | — | 96.5 |
| m14-q-delivery-b.json | images/image/webp/0/planner | five fresh-context first calls | 5 | 0.4 | — | 0.6 |
| m14-q-delivery-b.json | images/image/webp/0/planner | warm first context | 24 | 0.3 | 0.5 | 0.6 |
| m14-q-delivery-b.json | images/image/webp/0/preparation | five fresh-context first calls | 5 | 15 | — | 18.6 |
| m14-q-delivery-b.json | images/image/webp/0/preparation | warm first context | 12 | 16.9 | — | 18.1 |
| m14-q-delivery-b.json | images/image/webp/0/plannerAndPreparation | five fresh-context first calls | 5 | 16.9 | — | 17.9 |
| m14-q-delivery-b.json | images/image/webp/0/plannerAndPreparation | warm first context | 12 | 16.9 | — | 17.8 |
| m14-q-delivery-b.json | images/image/webp/1/planner | five fresh-context first calls | 5 | 1.1 | — | 1.4 |
| m14-q-delivery-b.json | images/image/webp/1/planner | warm first context | 12 | 0.9 | — | 1.4 |
| m14-q-delivery-b.json | images/image/webp/1/preparation | five fresh-context first calls | 5 | 43.4 | — | 47.6 |
| m14-q-delivery-b.json | images/image/webp/1/preparation | warm first context | 6 | 34.6 | — | 92.1 |
| m14-q-delivery-b.json | images/image/webp/1/plannerAndPreparation | five fresh-context first calls | 5 | 34.4 | — | 52.6 |
| m14-q-delivery-b.json | images/image/webp/1/plannerAndPreparation | warm first context | 6 | 47.2 | — | 53.4 |
| m14-q-delivery-b.json | images/image/webp/2/planner | five fresh-context first calls | 5 | 2.7 | — | 3.5 |
| m14-q-delivery-b.json | images/image/webp/2/planner | warm first context | 12 | 2.5 | — | 3.2 |
| m14-q-delivery-b.json | images/image/webp/2/preparation | five fresh-context first calls | 5 | 134.5 | — | 148.7 |
| m14-q-delivery-b.json | images/image/webp/2/preparation | warm first context | 6 | 152.9 | — | 166.5 |
| m14-q-delivery-b.json | images/image/webp/2/plannerAndPreparation | five fresh-context first calls | 5 | 127.8 | — | 161.3 |
| m14-q-delivery-b.json | images/image/webp/2/plannerAndPreparation | warm first context | 6 | 150.8 | — | 164.2 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacySmallPng | five fresh-context first calls | 5 | 0.5 | — | 0.7 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacySmallPng | warm first context | 15 | 0.3 | — | 0.6 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacyMediumPng | five fresh-context first calls | 5 | 27.1 | — | 30.9 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacyMediumPng | warm first context | 8 | 38.3 | — | 43.8 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacyLargePng | five fresh-context first calls | 5 | 109.2 | — | 121 |
| m14-q-delivery-b.json | nativeRequestPreparation/legacyLargePng | warm first context | 6 | 125.2 | — | 145.5 |
| m14-q-delivery-b.json | nativeRequestPreparation/smallPng | five fresh-context first calls | 5 | 0.2 | — | 0.2 |
| m14-q-delivery-b.json | nativeRequestPreparation/smallPng | warm first context | 15 | 0 | — | 0.1 |
| m14-q-delivery-b.json | nativeRequestPreparation/mediumPng | five fresh-context first calls | 5 | 0.4 | — | 0.6 |
| m14-q-delivery-b.json | nativeRequestPreparation/mediumPng | warm first context | 8 | 0.3 | — | 0.5 |
| m14-q-delivery-b.json | nativeRequestPreparation/largePng | five fresh-context first calls | 5 | 1.2 | — | 2 |
| m14-q-delivery-b.json | nativeRequestPreparation/largePng | warm first context | 6 | 1.9 | — | 2.6 |
| m14-q-delivery-b.json | nativeRequestPreparation/automaticPasteMessages | five fresh-context first calls | 5 | 0 | — | 0.1 |
| m14-q-delivery-b.json | nativeRequestPreparation/automaticPasteMessages | warm first context | 30 | 0 | 0.1 | 0.1 |

## Browser UI

| Evidence / tier | Operation | n | Median | p95 | Maximum |
| --- | --- | --- | --- | --- | --- |
| m14-q-browser-a.json / 0 | coldOptions | 5 | 71 | — | 139 |
| m14-q-browser-a.json / 0 | coldPanel | 5 | 31.3 | — | 37 |
| m14-q-browser-a.json / 0 | launches | 5 | 318.549 | — | 1045.602 |
| m14-q-browser-a.json / 0 | warmOptions | 30 | 31.6 | 48.6 | 48.7 |
| m14-q-browser-a.json / 0 | warmPanel | 30 | 31.6 | 31.9 | 31.9 |
| m14-q-browser-a.json / 0 | searchNoMatch | 30 | 31.7 | 32.6 | 32.7 |
| m14-q-browser-a.json / 0 | searchCommon | 30 | 31.8 | 32.5 | 32.6 |
| m14-q-browser-a.json / 0 | searchRare | 30 | 31.8 | 32.2 | 32.3 |
| m14-q-browser-a.json / 0 | scrolling | 0 | — | — | — |
| m14-q-browser-a.json / 100 | coldOptions | 5 | 169.8 | — | 181.6 |
| m14-q-browser-a.json / 100 | coldPanel | 5 | 31 | — | 35.5 |
| m14-q-browser-a.json / 100 | launches | 5 | 300.592 | — | 311.767 |
| m14-q-browser-a.json / 100 | warmOptions | 30 | 98.3 | 131 | 131.6 |
| m14-q-browser-a.json / 100 | warmPanel | 30 | 31.5 | 46.8 | 47.3 |
| m14-q-browser-a.json / 100 | searchNoMatch | 30 | 23.5 | 28.9 | 30.1 |
| m14-q-browser-a.json / 100 | searchCommon | 30 | 66.2 | 88.9 | 96.3 |
| m14-q-browser-a.json / 100 | searchRare | 30 | 20 | 31 | 31.7 |
| m14-q-browser-a.json / 100 | scrolling | 30 | 33.4 | 34.3 | 34.6 |
| m14-q-browser-a.json / 100 | edit | 30 | 31.7 | 32.3 | 63.7 |
| m14-q-browser-a.json / 100 | editorTypingProtocol | 30 | 5.425 | 13.402 | 15 |
| m14-q-browser-a.json / 100 | save | 30 | 32.3 | 47.9 | 48.3 |
| m14-q-browser-a.json / 100 | confirmedDeleteMs (one event) | 1 | 21.5 | — | 21.5 |
| m14-q-browser-a.json / 1000 | coldOptions | 5 | 723.2 | — | 795.6 |
| m14-q-browser-a.json / 1000 | coldPanel | 5 | 43.8 | — | 50 |
| m14-q-browser-a.json / 1000 | launches | 5 | 309.765 | — | 355.648 |
| m14-q-browser-a.json / 1000 | warmOptions | 30 | 606.7 | 751.5 | 900.5 |
| m14-q-browser-a.json / 1000 | warmPanel | 30 | 31.7 | 32.2 | 46.4 |
| m14-q-browser-a.json / 1000 | searchNoMatch | 30 | 21.1 | 36.5 | 57.1 |
| m14-q-browser-a.json / 1000 | searchCommon | 30 | 516.7 | 688.1 | 774.2 |
| m14-q-browser-a.json / 1000 | searchRare | 30 | 22.3 | 32.8 | 47.3 |
| m14-q-browser-a.json / 1000 | scrolling | 30 | 33.3 | 33.7 | 34.2 |
| m14-q-browser-a.json / 1000 | edit | 30 | 44.9 | 73.6 | 83.6 |
| m14-q-browser-a.json / 1000 | editorTypingProtocol | 30 | 25.121 | 29.225 | 34.445 |
| m14-q-browser-a.json / 1000 | save | 30 | 123.6 | 186.4 | 216.1 |
| m14-q-browser-a.json / 1000 | confirmedDeleteMs (one event) | 1 | 113.1 | — | 113.1 |
| m14-q-browser-a.json / 10000 | coldOptions | 5 | 6903.8 | — | 10204.3 |
| m14-q-browser-a.json / 10000 | coldPanel | 5 | 168.8 | — | 201 |
| m14-q-browser-a.json / 10000 | launches | 5 | 327.929 | — | 341.407 |
| m14-q-browser-a.json / 10000 | warmOptions | 10 | 9640.4 | — | 11033.4 |
| m14-q-browser-a.json / 10000 | warmPanel | 30 | 31.8 | 98.7 | 125.7 |
| m14-q-browser-a.json / 10000 | searchNoMatch | 30 | 479.3 | 639.8 | 686.2 |
| m14-q-browser-a.json / 10000 | searchCommon | 30 | 8269.7 | 9978.6 | 10056.4 |
| m14-q-browser-image-edit.json / mixed-image-edit | imageEdit | 30 | 58 | 176.4 | 240.8 |
| m14-q-browser-mixed.json / mixed | coldOptions | 5 | 724.2 | — | 742 |
| m14-q-browser-mixed.json / mixed | coldPanel | 5 | 47.8 | — | 64.9 |
| m14-q-browser-mixed.json / mixed | launches | 5 | 322.806 | — | 1093.444 |
| m14-q-browser-mixed.json / mixed | initialEmptyOptions | 5 | 244.5 | — | 433.7 |
| m14-q-browser-mixed.json / mixed | warmOptions | 30 | 1089.8 | 1542.4 | 1562.1 |
| m14-q-browser-mixed.json / mixed | frameWaitControl | 30 | 30.6 | 32.5 | 33.3 |
| m14-q-browser-mixed.json / mixed | warmPanel | 30 | 47.6 | 79.2 | 81.3 |
| m14-q-browser-mixed.json / mixed | searchNoMatch | 30 | 29.9 | 44.6 | 125.4 |
| m14-q-browser-mixed.json / mixed | searchCommon | 30 | 1145.8 | 1557.5 | 1636.3 |
| m14-q-browser-mixed.json / mixed | searchRare | 30 | 33.9 | 44.3 | 49.9 |
| m14-q-browser-mixed.json / mixed | typeFilterImages | 30 | 40.3 | 54.6 | 55.7 |
| m14-q-browser-mixed.json / mixed | scrolling | 30 | 33.4 | 33.7 | 33.9 |
| m14-q-browser-mixed.json / mixed | edit | 30 | 107.9 | 150.2 | 251 |
| m14-q-browser-mixed.json / mixed | editorTypingProtocol | 30 | 53.393 | 81.829 | 107.509 |
| m14-q-browser-mixed.json / mixed | save | 30 | 278.9 | 319.4 | 324.4 |
| m14-q-browser-mixed.json / mixed | confirmedDeleteMs (one event) | 1 | 154.7 | — | 154.7 |
| m14-q-browser-repeat.json / 1000 | coldOptions | 5 | 707.5 | — | 713.8 |
| m14-q-browser-repeat.json / 1000 | coldPanel | 5 | 51.9 | — | 201.8 |
| m14-q-browser-repeat.json / 1000 | launches | 5 | 464.454 | — | 473.278 |
| m14-q-browser-repeat.json / 1000 | initialEmptyOptions | 5 | 263.6 | — | 274.7 |
| m14-q-browser-repeat.json / 1000 | warmOptions | 30 | 1193.1 | 1542.6 | 1551.1 |
| m14-q-browser-repeat.json / 1000 | frameWaitControl | 30 | 31.5 | 32.1 | 43.9 |
| m14-q-browser-repeat.json / 1000 | warmPanel | 30 | 47.4 | 63.3 | 64.1 |
| m14-q-browser-repeat.json / 1000 | searchNoMatch | 30 | 34.2 | 46.4 | 47.8 |
| m14-q-browser-repeat.json / 1000 | searchCommon | 30 | 1101.8 | 1382.6 | 1414 |
| m14-q-browser-repeat.json / 1000 | searchRare | 30 | 40.5 | 55 | 57.5 |
| m14-q-browser-repeat.json / 1000 | typeFilterImages | 30 | 30.1 | 48.2 | 71.6 |
| m14-q-browser-repeat.json / 1000 | scrolling | 30 | 33.3 | 33.9 | 39.2 |
| m14-q-browser-repeat.json / 1000 | edit | 30 | 96.5 | 152.2 | 218.5 |
| m14-q-browser-repeat.json / 1000 | editorTypingProtocol | 30 | 53.97 | 71.519 | 77.157 |
| m14-q-browser-repeat.json / 1000 | save | 30 | 277.7 | 319.3 | 386.9 |
| m14-q-browser-repeat.json / 1000 | confirmedDeleteMs (one event) | 1 | 154.6 | — | 154.6 |
| m14-q-browser-repeat.json / 10000 | coldOptions | 5 | 11704.1 | — | 13377.2 |
| m14-q-browser-repeat.json / 10000 | coldPanel | 5 | 503.4 | — | 678.7 |
| m14-q-browser-repeat.json / 10000 | launches | 5 | 429.981 | — | 471.898 |
| m14-q-browser-repeat.json / 10000 | initialEmptyOptions | 5 | 250.2 | — | 437.1 |
| m14-q-browser-repeat.json / 10000 | warmOptions | 3 | 14111.9 | — | 14131.4 |
| m14-q-browser-repeat.json / 10000 | frameWaitControl | 3 | 31.7 | — | 33.2 |
| m14-q-browser-repeat.json / 10000 | warmPanel | 3 | 119.7 | — | 1070.9 |
| m14-q-browser-repeat.json / 10000 | searchNoMatch | 3 | 350.2 | — | 425.3 |
| m14-q-browser-repeat.json / 10000 | searchCommon | 3 | 13468.5 | — | 13782.4 |
| m14-q-browser-repeat.json / 10000 | searchRare | 3 | 390.3 | — | 400.7 |
| m14-q-browser-repeat.json / 10000 | typeFilterImages | 3 | 343.9 | — | 451 |
| m14-q-browser-repeat.json / 10000 | scrolling | 30 | 33.3 | 37.7 | 48.4 |
| m14-q-browser-repeat.json / 10000 | edit | 3 | 669.6 | — | 939.1 |
| m14-q-browser-repeat.json / 10000 | editorTypingProtocol | 30 | 229.545 | 372.782 | 585.248 |
| m14-q-browser-repeat.json / 10000 | save | 3 | 1171.1 | — | 1189.8 |
| m14-q-browser-repeat.json / 10000 | confirmedDeleteMs (one event) | 1 | 1056.2 | — | 1056.2 |

## Controlled trigger handler, pooled five contexts

| Catalog / mode / editor / scenario | Phase / stage | n | Median | p95 | Maximum | Delivery calls |
| --- | --- | --- | --- | --- | --- | --- |
| 100 / clipboard-only / input / ordinary | first-use / synchronousMs | 5 | 0.1 | — | 0.3 | 0 |
| 100 / clipboard-only / input / ordinary | first-use / totalMs | 5 | 0.1 | — | 0.3 | 0 |
| 100 / clipboard-only / input / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / input / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / input / unknown | first-use / synchronousMs | 5 | 0.4 | — | 0.8 | 0 |
| 100 / clipboard-only / input / unknown | first-use / totalMs | 5 | 0.4 | — | 0.8 | 0 |
| 100 / clipboard-only / input / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / input / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / input / accepted | first-use / synchronousMs | 5 | 0.2 | — | 0.3 | 5 |
| 100 / clipboard-only / input / accepted | first-use / totalMs | 5 | 0.4 | — | 1.7 | 5 |
| 100 / clipboard-only / input / accepted | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 150 |
| 100 / clipboard-only / input / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 100 / clipboard-only / textarea / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / clipboard-only / textarea / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / clipboard-only / textarea / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 100 / clipboard-only / textarea / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 100 / clipboard-only / textarea / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / textarea / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / textarea / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / textarea / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / textarea / accepted | first-use / synchronousMs | 5 | 0 | — | 0 | 5 |
| 100 / clipboard-only / textarea / accepted | first-use / totalMs | 5 | 0 | — | 0.1 | 5 |
| 100 / clipboard-only / textarea / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 100 / clipboard-only / textarea / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 100 / clipboard-only / rich / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / clipboard-only / rich / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / clipboard-only / rich / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / rich / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / rich / unknown | first-use / synchronousMs | 5 | 0.3 | — | 1.8 | 0 |
| 100 / clipboard-only / rich / unknown | first-use / totalMs | 5 | 0.3 | — | 1.8 | 0 |
| 100 / clipboard-only / rich / unknown | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 0 |
| 100 / clipboard-only / rich / unknown | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 0 |
| 100 / clipboard-only / rich / accepted | first-use / synchronousMs | 5 | 0.2 | — | 0.2 | 5 |
| 100 / clipboard-only / rich / accepted | first-use / totalMs | 5 | 0.3 | — | 2 | 5 |
| 100 / clipboard-only / rich / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 100 / clipboard-only / rich / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 150 |
| 100 / clipboard-only / shadow / ordinary | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / shadow / ordinary | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / shadow / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 100 / clipboard-only / shadow / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 100 / clipboard-only / shadow / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / shadow / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 100 / clipboard-only / shadow / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / shadow / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / clipboard-only / shadow / accepted | first-use / synchronousMs | 5 | 0 | — | 0 | 5 |
| 100 / clipboard-only / shadow / accepted | first-use / totalMs | 5 | 0.1 | — | 0.1 | 5 |
| 100 / clipboard-only / shadow / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 100 / clipboard-only / shadow / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 150 |
| 100 / automatic / input / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / input / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / input / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / input / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / input / unknown | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / input / unknown | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / input / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / input / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / input / accepted | first-use / synchronousMs | 5 | 0.2 | — | 0.3 | 10 |
| 100 / automatic / input / accepted | first-use / totalMs | 5 | 0.7 | — | 1.2 | 10 |
| 100 / automatic / input / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 300 |
| 100 / automatic / input / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 100 / automatic / textarea / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / textarea / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / textarea / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / textarea / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / textarea / unknown | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / textarea / unknown | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / textarea / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / textarea / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / textarea / accepted | first-use / synchronousMs | 5 | 0 | — | 0.1 | 10 |
| 100 / automatic / textarea / accepted | first-use / totalMs | 5 | 0.1 | — | 0.1 | 10 |
| 100 / automatic / textarea / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 300 |
| 100 / automatic / textarea / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 100 / automatic / rich / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / rich / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / rich / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 100 / automatic / rich / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 100 / automatic / rich / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 100 / automatic / rich / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 100 / automatic / rich / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / rich / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / rich / accepted | first-use / synchronousMs | 5 | 0.1 | — | 0.2 | 10 |
| 100 / automatic / rich / accepted | first-use / totalMs | 5 | 0.5 | — | 0.8 | 10 |
| 100 / automatic / rich / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.6 | 300 |
| 100 / automatic / rich / accepted | warm / totalMs | 150 | 0.1 | 0.2 | 0.7 | 300 |
| 100 / automatic / shadow / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / shadow / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 100 / automatic / shadow / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / shadow / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / shadow / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 100 / automatic / shadow / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 100 / automatic / shadow / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / shadow / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 100 / automatic / shadow / accepted | first-use / synchronousMs | 5 | 0 | — | 0.1 | 10 |
| 100 / automatic / shadow / accepted | first-use / totalMs | 5 | 0.1 | — | 0.3 | 10 |
| 100 / automatic / shadow / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 100 / automatic / shadow / accepted | warm / totalMs | 150 | 0.1 | 0.2 | 0.2 | 300 |
| 10000 / clipboard-only / input / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / input / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / input / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / clipboard-only / input / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / input / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / input / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / input / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / input / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / input / accepted | first-use / synchronousMs | 5 | 0 | — | 0.4 | 5 |
| 10000 / clipboard-only / input / accepted | first-use / totalMs | 5 | 0.1 | — | 0.4 | 5 |
| 10000 / clipboard-only / input / accepted | warm / synchronousMs | 150 | 0 | 0 | 0 | 150 |
| 10000 / clipboard-only / input / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 10000 / clipboard-only / textarea / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / textarea / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / textarea / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / textarea / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / textarea / unknown | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / textarea / unknown | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / textarea / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / textarea / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / textarea / accepted | first-use / synchronousMs | 5 | 0 | — | 0.1 | 5 |
| 10000 / clipboard-only / textarea / accepted | first-use / totalMs | 5 | 0 | — | 0.1 | 5 |
| 10000 / clipboard-only / textarea / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 10000 / clipboard-only / textarea / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 10000 / clipboard-only / rich / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / rich / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / rich / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / clipboard-only / rich / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / clipboard-only / rich / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / rich / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / rich / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / rich / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / rich / accepted | first-use / synchronousMs | 5 | 0 | — | 0 | 5 |
| 10000 / clipboard-only / rich / accepted | first-use / totalMs | 5 | 0.1 | — | 0.1 | 5 |
| 10000 / clipboard-only / rich / accepted | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 150 |
| 10000 / clipboard-only / rich / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 150 |
| 10000 / clipboard-only / shadow / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / shadow / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / clipboard-only / shadow / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / clipboard-only / shadow / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / clipboard-only / shadow / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / shadow / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / clipboard-only / shadow / unknown | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 0 |
| 10000 / clipboard-only / shadow / unknown | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 0 |
| 10000 / clipboard-only / shadow / accepted | first-use / synchronousMs | 5 | 0 | — | 0 | 5 |
| 10000 / clipboard-only / shadow / accepted | first-use / totalMs | 5 | 0.1 | — | 0.2 | 5 |
| 10000 / clipboard-only / shadow / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 10000 / clipboard-only / shadow / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 150 |
| 10000 / automatic / input / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / input / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / input / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / input / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / input / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / input / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / input / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / input / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / input / accepted | first-use / synchronousMs | 5 | 0 | — | 0 | 10 |
| 10000 / automatic / input / accepted | first-use / totalMs | 5 | 0.1 | — | 0.1 | 10 |
| 10000 / automatic / input / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 300 |
| 10000 / automatic / input / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 10000 / automatic / textarea / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / textarea / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / textarea / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / textarea / ordinary | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / textarea / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / textarea / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / textarea / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / textarea / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / textarea / accepted | first-use / synchronousMs | 5 | 0.1 | — | 0.1 | 10 |
| 10000 / automatic / textarea / accepted | first-use / totalMs | 5 | 0.1 | — | 0.2 | 10 |
| 10000 / automatic / textarea / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.1 | 300 |
| 10000 / automatic / textarea / accepted | warm / totalMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 10000 / automatic / rich / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / rich / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / rich / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / rich / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / rich / unknown | first-use / synchronousMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / rich / unknown | first-use / totalMs | 5 | 0 | — | 0.1 | 0 |
| 10000 / automatic / rich / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / rich / unknown | warm / totalMs | 150 | 0 | 0.1 | 0.1 | 0 |
| 10000 / automatic / rich / accepted | first-use / synchronousMs | 5 | 0 | — | 0.1 | 10 |
| 10000 / automatic / rich / accepted | first-use / totalMs | 5 | 0.2 | — | 0.3 | 10 |
| 10000 / automatic / rich / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.2 | 300 |
| 10000 / automatic / rich / accepted | warm / totalMs | 150 | 0.1 | 0.2 | 0.3 | 300 |
| 10000 / automatic / shadow / ordinary | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / shadow / ordinary | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / shadow / ordinary | warm / synchronousMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / shadow / ordinary | warm / totalMs | 150 | 0 | 0 | 0 | 0 |
| 10000 / automatic / shadow / unknown | first-use / synchronousMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / shadow / unknown | first-use / totalMs | 5 | 0 | — | 0 | 0 |
| 10000 / automatic / shadow / unknown | warm / synchronousMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / shadow / unknown | warm / totalMs | 150 | 0 | 0 | 0.1 | 0 |
| 10000 / automatic / shadow / accepted | first-use / synchronousMs | 5 | 0.1 | — | 0.1 | 10 |
| 10000 / automatic / shadow / accepted | first-use / totalMs | 5 | 0.2 | — | 0.3 | 10 |
| 10000 / automatic / shadow / accepted | warm / synchronousMs | 150 | 0 | 0.1 | 0.6 | 300 |
| 10000 / automatic / shadow / accepted | warm / totalMs | 150 | 0.1 | 0.2 | 0.9 | 300 |

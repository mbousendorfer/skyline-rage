// mode: angular · design-guidelines · DS: @agorapulse/ui-components (npm @latest)
import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { ModalComponent } from '@agorapulse/ui-components/modal';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { AutocompleteComponent } from '@agorapulse/ui-components/autocomplete';

export type CollabUser = { handle: string; name: string; avatar: string };

const COLLAB_MOCK_USERS: CollabUser[] = [
    { handle: '@sophie.martin',     name: 'Sophie Martin',  avatar: 'https://i.pravatar.cc/40?img=1' },
    { handle: '@lucas.photography', name: 'Lucas Bernard',  avatar: 'https://i.pravatar.cc/40?img=2' },
    { handle: '@marie.creates',     name: 'Marie Dupont',   avatar: 'https://i.pravatar.cc/40?img=3' },
    { handle: '@julien.traveler',   name: 'Julien Moreau',  avatar: 'https://i.pravatar.cc/40?img=4' },
    { handle: '@camille.studio',    name: 'Camille Leroy',  avatar: 'https://i.pravatar.cc/40?img=5' },
    { handle: '@theo.visuals',      name: 'Théo Petit',     avatar: 'https://i.pravatar.cc/40?img=6' },
];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-collab-modal',
    imports: [ModalComponent, ButtonComponent, AutocompleteComponent],
    template: `
        <ng-template #headerTemplate>
            <div class="collab-modal-titles">
                <span class="collab-modal-title">Invite Collaborators</span>
                <span class="collab-modal-subtitle">Up to 3 collaborators can be invited to this post</span>
            </div>
        </ng-template>

        <ng-template #mainTemplate>
            <div class="collab-modal-body">
                @if (pending().length < 3) {
                    <ap-autocomplete
                        placeholder="Search Instagram accounts…"
                        optionLabel="name"
                        optionCaption="handle"
                        optionImageUrl="avatar"
                        [searchFn]="searchFn"
                        (selectOption)="onSelect($event)">
                    </ap-autocomplete>
                } @else {
                    <div class="collab-max-reached">Maximum of 3 collaborators reached</div>
                }
                @if (pending().length > 0) {
                    <div class="collab-chips">
                        @for (user of pending(); track user.handle) {
                            <div class="collab-chip">
                                <img class="collab-avatar-sm" [src]="user.avatar" [alt]="user.name" />
                                <span class="collab-chip-handle">{{ user.handle }}</span>
                                <button class="collab-chip-remove" (click)="remove(user.handle)">×</button>
                            </div>
                        }
                    </div>
                }
            </div>
        </ng-template>

        <ng-template #footerTemplate>
            <div class="collab-modal-footer">
                <ap-button [config]="{ style: 'ghost', color: 'grey' }" (click)="cancel()">Cancel</ap-button>
                <ap-button [config]="{ style: 'primary', color: 'orange' }" (click)="confirm()">Confirm</ap-button>
            </div>
        </ng-template>

        <ap-modal
            [closable]="true"
            [headerTemplate]="headerTemplate"
            [mainTemplate]="mainTemplate"
            [footerTemplate]="footerTemplate">
        </ap-modal>
    `,
    styles: [`
        .collab-modal-titles { display: flex; flex-direction: column; gap: var(--ref-spacing-xxxs); }
        .collab-modal-title {
            font-size: var(--sys-text-style-h3-size); font-weight: var(--sys-text-style-h3-weight);
            line-height: var(--sys-text-style-h3-line-height); color: var(--sys-text-color-default);
        }
        .collab-modal-subtitle {
            font-size: var(--sys-text-style-caption-size); line-height: var(--sys-text-style-caption-line-height);
            color: var(--ref-color-grey-60);
        }
        .collab-modal-body {
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            display: flex; flex-direction: column; gap: var(--ref-spacing-xs); min-width: 360px;
        }
        .collab-max-reached {
            font-size: var(--sys-text-style-caption-size); line-height: var(--sys-text-style-caption-line-height);
            color: var(--ref-color-grey-60); padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            background: var(--ref-color-grey-05); border-radius: var(--sys-border-radius-sm);
        }
        .collab-chips { display: flex; flex-wrap: wrap; gap: var(--ref-spacing-xxs); }
        .collab-chip {
            display: inline-flex; align-items: center; gap: var(--ref-spacing-xxxs);
            height: var(--ref-spacing-md); padding: 0 var(--ref-spacing-xxs);
            border-radius: var(--comp-label-border-radius); background: var(--ref-color-grey-10);
        }
        .collab-avatar-sm { width: var(--ref-spacing-md); height: var(--ref-spacing-md); border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .collab-chip-handle {
            font-size: var(--sys-text-style-caption-size); line-height: var(--sys-text-style-caption-line-height);
            color: var(--ref-color-grey-100);
        }
        .collab-chip-remove {
            background: none; border: none; color: var(--ref-color-grey-60); cursor: pointer; padding: 0;
            font-size: var(--sys-text-style-body-size); line-height: var(--sys-text-style-body-line-height);
        }
        .collab-modal-footer {
            display: flex; justify-content: flex-end; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
        }
    `],
})
export class CollabModalComponent {
    pending = signal<CollabUser[]>([]);

    constructor(
        public dialogRef: MatDialogRef<CollabModalComponent, CollabUser[]>,
        @Inject(MAT_DIALOG_DATA) data: { collaborators?: CollabUser[] } | null,
    ) {
        this.pending.set([...(data?.collaborators ?? [])]);
    }

    searchFn = (term: string): Observable<CollabUser[]> => {
        const q = term.toLowerCase();
        const selected = new Set(this.pending().map(u => u.handle));
        return of(COLLAB_MOCK_USERS.filter(u =>
            !selected.has(u.handle) && (u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)),
        ).slice(0, 6));
    };

    onSelect(user: unknown): void {
        if (this.pending().length < 3) this.pending.update(l => [...l, user as CollabUser]);
    }

    remove(handle: string): void {
        this.pending.update(l => l.filter(u => u.handle !== handle));
    }

    cancel(): void { this.dialogRef.close(); }
    confirm(): void { this.dialogRef.close(this.pending()); }
}

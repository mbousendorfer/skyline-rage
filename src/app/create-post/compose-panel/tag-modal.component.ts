// mode: angular · design-guidelines · DS: @agorapulse/ui-components (npm @latest)
import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { ModalComponent } from '@agorapulse/ui-components/modal';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { AutocompleteComponent } from '@agorapulse/ui-components/autocomplete';

export interface TaggedUser { id: string; x: number; y: number; username: string; }

const TAG_USERS = ['sarah_design', 'john_marketing', 'alex_creative', 'maya_social', 'lucas_brand'];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-tag-modal',
    imports: [ModalComponent, ButtonComponent, AutocompleteComponent],
    template: `
        <ng-template #headerTemplate>
            <h2 class="tag-modal-title">Tag users</h2>
        </ng-template>

        <ng-template #mainTemplate>
            <div class="tag-modal-image-area" (click)="onImageClick($event)">
                @if (imageUrl) {
                    <img class="tag-modal-img" [src]="imageUrl" alt="Post image" />
                } @else {
                    <div class="tag-modal-no-image">No image available — add an image to the post first</div>
                }

                @for (tag of tags(); track tag.id) {
                    <div class="tag-pin" [style.left.%]="tag.x" [style.top.%]="tag.y">
                        <div class="tag-pin-dot"></div>
                        <div class="tag-pin-badge">
                            <span>&#64;{{ tag.username }}</span>
                            <button class="tag-pin-remove" (click)="$event.stopPropagation(); removeTag(tag.id)">×</button>
                        </div>
                    </div>
                }

                @if (pendingPin(); as pin) {
                    <div class="tag-pin" [style.left.%]="pin.x" [style.top.%]="pin.y" (click)="$event.stopPropagation()">
                        <div class="tag-pin-dot"></div>
                        <div class="tag-pin-autocomplete">
                            <ap-autocomplete placeholder="Search username…" [searchFn]="searchFn" (selectOption)="onSelect($event)"></ap-autocomplete>
                        </div>
                    </div>
                }
            </div>
        </ng-template>

        <ng-template #footerTemplate>
            <div class="tag-modal-footer">
                <ap-button [config]="{ style: 'ghost', color: 'grey' }" (click)="cancel()">Cancel</ap-button>
                <ap-button [config]="{ style: 'primary', color: 'orange' }" (click)="save()">Save tags</ap-button>
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
        .tag-modal-title {
            font-size: var(--sys-text-style-h3-size); font-weight: var(--sys-text-style-h3-weight);
            line-height: var(--sys-text-style-h3-line-height); color: var(--sys-text-color-default); margin: 0;
        }
        .tag-modal-image-area {
            position: relative; cursor: crosshair;
            background: var(--ref-color-grey-10);
            width: 400px; max-width: 70vw; aspect-ratio: 1; overflow: hidden;
            border-radius: var(--sys-border-radius-sm);
        }
        .tag-modal-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tag-modal-no-image {
            display: flex; align-items: center; justify-content: center; height: 100%;
            color: var(--ref-color-grey-60); font-size: var(--sys-text-style-body-size);
            text-align: center; padding: var(--ref-spacing-md);
        }
        .tag-pin {
            position: absolute; transform: translate(-50%, -50%);
            display: flex; flex-direction: column; align-items: center; gap: var(--ref-spacing-xxxs);
            z-index: 10; pointer-events: none;
        }
        .tag-pin-dot {
            width: var(--ref-spacing-xs); height: var(--ref-spacing-xs); border-radius: 50%;
            background: var(--ref-color-white); border: 2px solid var(--ref-color-grey-100);
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .tag-pin-badge {
            display: flex; align-items: center; gap: var(--ref-spacing-xxxs);
            background: rgba(0,0,0,0.7); color: var(--ref-color-white);
            font-size: var(--sys-text-style-caption-size); line-height: var(--sys-text-style-caption-line-height);
            padding: 2px 6px; border-radius: var(--sys-border-radius-sm);
            pointer-events: all; white-space: nowrap;
        }
        .tag-pin-remove {
            background: none; border: none; color: var(--ref-color-white); cursor: pointer; padding: 0;
            font-size: var(--sys-text-style-body-size); line-height: var(--sys-text-style-body-line-height);
        }
        .tag-pin-autocomplete { pointer-events: all; min-width: 200px; }
        .tag-modal-footer {
            display: flex; justify-content: flex-end; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
        }
    `],
})
export class TagModalComponent {
    tags = signal<TaggedUser[]>([]);
    pendingPin = signal<{ x: number; y: number } | null>(null);
    readonly imageUrl: string | null;

    constructor(
        public dialogRef: MatDialogRef<TagModalComponent, TaggedUser[]>,
        @Inject(MAT_DIALOG_DATA) data: { imageUrl?: string | null; tags?: TaggedUser[] } | null,
    ) {
        this.imageUrl = data?.imageUrl ?? null;
        this.tags.set([...(data?.tags ?? [])]);
    }

    onImageClick(event: MouseEvent): void {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        this.pendingPin.set({ x, y });
    }

    searchFn = (term: string): Observable<string[]> => {
        const q = term.toLowerCase();
        return of(TAG_USERS.filter(u => u.includes(q)).slice(0, 5));
    };

    onSelect(username: unknown): void {
        const pin = this.pendingPin();
        if (!pin) return;
        this.tags.update(t => [...t, { id: crypto.randomUUID(), x: pin.x, y: pin.y, username: username as string }]);
        this.pendingPin.set(null);
    }

    removeTag(id: string): void {
        this.tags.update(t => t.filter(x => x.id !== id));
    }

    cancel(): void { this.dialogRef.close(); }
    save(): void { this.dialogRef.close(this.tags()); }
}

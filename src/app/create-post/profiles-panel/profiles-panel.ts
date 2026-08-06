import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
import { InputSearchComponent } from '@agorapulse/ui-components/input-search';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComposeStateService, Profile, ProfileGroup } from '../compose-state';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-profiles-panel',
    imports: [CheckboxComponent, AvatarComponent, TabsComponent, TabComponent, InputSearchComponent, TooltipDirective, SymbolComponent, FormsModule],
    template: `
        <div class="profiles-panel">
            <div class="panel-header">Social Profiles</div>

            <div class="search-box">
                <ap-input-search
                    placeholder="Search..."
                    [clearable]="true"
                    [ngModel]="searchQuery()"
                    (ngModelChange)="onSearch($event)">
                </ap-input-search>
            </div>

            <ap-tabs class="profiles-tabs"
                [selectedIndex]="activeTab() === 'profiles' ? 0 : 1"
                (tabChange)="activeTab.set($event.index === 0 ? 'profiles' : 'queues')">
                <ap-tab label="Profiles"></ap-tab>
                <ap-tab label="Queues" [apTooltip]="'Post at optimal times using your pre-configured queue schedule'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-tab>
            </ap-tabs>

            @if (activeTab() === 'profiles') {
                <div class="select-all">
                    <ap-checkbox name="select-all" [checked]="state.allSelected()" (change)="state.toggleAll($event)">
                        Select all
                    </ap-checkbox>
                </div>

                <div class="groups-list">
                    @for (group of filteredGroups(); track group.id) {
                        <div class="group">
                            <div class="group-header">
                                <ap-checkbox
                                    [name]="'group-' + group.id"
                                    [checked]="isGroupChecked(group)"
                                    [indeterminate]="isGroupIndeterminate(group)"
                                    (change)="toggleGroupProfiles(group, $event)">
                                </ap-checkbox>
                                <div class="group-label" (click)="state.toggleGroup(group.id)">
                                    <ap-symbol symbolId="folder" size="xs" color="basic-grey"></ap-symbol>
                                    <span class="group-name ap-truncate">{{ group.name }}</span>
                                    <ap-symbol
                                        [symbolId]="group.expanded ? 'chevron-up' : 'chevron-down'"
                                        size="xs"
                                        color="basic-grey">
                                    </ap-symbol>
                                </div>
                            </div>
                            @if (group.expanded) {
                                <div class="group-profiles">
                                    @for (profile of filterProfiles(group.profiles); track profile.id) {
                                        <div class="profile-item" [class.checked]="profile.checked" (click)="state.toggleProfile(profile.id, !profile.checked)">
                                            <ap-checkbox
                                                [name]="profile.id"
                                                [checked]="profile.checked"
                                                (change)="state.toggleProfile(profile.id, $event)">
                                            </ap-checkbox>
                                            <ap-avatar
                                                [username]="profile.name"
                                                [network]="profile.network"
                                                [size]="24">
                                            </ap-avatar>
                                            <span class="profile-name ap-truncate">{{ profile.name }}</span>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    @if (filteredUngrouped().length > 0) {
                        <div class="ungrouped-profiles">
                            @for (profile of filteredUngrouped(); track profile.id) {
                                <div class="profile-item" [class.checked]="profile.checked" (click)="state.toggleProfile(profile.id, !profile.checked)">
                                    <ap-checkbox
                                        [name]="profile.id"
                                        [checked]="profile.checked"
                                        (change)="state.toggleProfile(profile.id, $event)">
                                    </ap-checkbox>
                                    <ap-avatar
                                        [username]="profile.name"
                                        [network]="profile.network"
                                        [size]="24">
                                    </ap-avatar>
                                    <span class="profile-name ap-truncate">{{ profile.name }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>

                @if (state.selectedProfiles().length > 0) {
                    <div class="selected-summary">
                        <span class="selected-count">{{ state.selectedProfiles().length }} profile{{ state.selectedProfiles().length > 1 ? 's' : '' }} selected</span>
                    </div>
                }
            } @else {
                <div class="queues-empty">
                    <ap-symbol symbolId="clock" size="md" color="basic-grey"></ap-symbol>
                    <span>No queues configured</span>
                </div>
            }
        </div>
    `,
    styles: [`
        :host { display: flex; flex-direction: column; min-height: 0; flex: 0 0 220px; }
        .profiles-panel {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            width: 220px;
            min-width: 220px;
            border-right: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-grey-bg);
            overflow: hidden;
        }

        .search-box {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;

            ap-input-search { display: block; }
        }


        .profiles-tabs {
            display: block;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
            ::ng-deep .ap-tabs__content { display: none; }
        }

        .select-all {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .groups-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }

        .group-header {
            display: flex;
            align-items: center;
            gap: 0;
            padding: var(--ref-spacing-xs) var(--ref-spacing-xs) var(--ref-spacing-xxxs);

            &:hover { background: var(--ref-color-grey-05); }
        }

        .group-label {
            display: flex;
            align-items: center;
            gap: var(--ref-spacing-xxxs);
            flex: 1;
            padding: var(--ref-spacing-xxxs) 0 var(--ref-spacing-xxxs) var(--ref-spacing-xxs);
            cursor: pointer;
            min-width: 0;

            .group-name {
                flex: 1;
                font-size: var(--sys-text-style-caption-bold-size);
                font-weight: var(--sys-text-style-caption-bold-weight);
                line-height: var(--sys-text-style-caption-bold-line-height);
                color: var(--sys-text-color-light);
            }
        }

        .group-profiles {
            padding-left: var(--ref-spacing-xxxs);
        }

        .profile-item {
            display: flex;
            align-items: center;
            gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xs);
            cursor: pointer;
            transition: background 0.1s;

            &:hover { background: var(--ref-color-grey-05); }
            &.checked { background: var(--ref-color-electric-blue-10); }
            &.checked:hover { background: var(--ref-color-electric-blue-10); }
        }

        .ungrouped-profiles {
            padding-top: var(--ref-spacing-xxxs);
            border-top: 1px solid var(--sys-border-color-default);
            margin-top: var(--ref-spacing-xxxs);
        }

        .profile-name {
            font-size: var(--sys-text-style-body-size);
            font-weight: var(--sys-text-style-body-weight);
            color: var(--sys-text-color-default);
            flex: 1;
        }

        .selected-summary {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .selected-count {
            font-size: var(--sys-text-style-caption-size);
            color: var(--ref-color-electric-blue-100);
            font-weight: var(--sys-text-style-caption-weight);
        }

        .queues-empty {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ref-spacing-xxs);
            color: var(--sys-text-color-light);
            font-size: var(--sys-text-style-caption-size);
        }
    `],
})
export class ProfilesPanelComponent {
    state = inject(ComposeStateService);

    searchQuery = signal('');
    activeTab = signal<'profiles' | 'queues'>('profiles');

    filteredGroups = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (!q) return this.state.groups();
        return this.state.groups()
            .map(g => ({
                ...g,
                expanded: true,
                profiles: g.profiles.filter(p => p.name.toLowerCase().includes(q)),
            }))
            .filter(g => g.profiles.length > 0);
    });

    filteredUngrouped = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (!q) return this.state.ungroupedProfiles();
        return this.state.ungroupedProfiles().filter(p => p.name.toLowerCase().includes(q));
    });

    onSearch(query: string): void {
        this.searchQuery.set(query);
    }

    filterProfiles(profiles: Profile[]): Profile[] {
        const q = this.searchQuery().toLowerCase();
        if (!q) return profiles;
        return profiles.filter(p => p.name.toLowerCase().includes(q));
    }

    isGroupChecked(group: ProfileGroup): boolean {
        return group.profiles.length > 0 && group.profiles.every(p => p.checked);
    }

    isGroupIndeterminate(group: ProfileGroup): boolean {
        return group.profiles.some(p => p.checked) && !group.profiles.every(p => p.checked);
    }

    toggleGroupProfiles(group: ProfileGroup, checked: boolean): void {
        group.profiles.forEach(p => this.state.toggleProfile(p.id, checked));
    }
}

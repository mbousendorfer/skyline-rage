import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CreatePostComponent } from './create-post/create-post';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-root',
    imports: [CreatePostComponent],
    template: `<app-create-post></app-create-post>`,
    styles: [`:host { display: block; height: 100vh; overflow: hidden; }`],
})
export class App {}

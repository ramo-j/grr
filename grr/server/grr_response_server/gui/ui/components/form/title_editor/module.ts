import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {TitleEditor, TitleEditorContent} from './title_editor';

@NgModule({
  imports: [
    // TODO: re-enable clang format when solved.
    // clang-format off
    // keep-sorted start block=yes
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    // keep-sorted end
    // clang-format on
  ],
  declarations: [TitleEditorContent, TitleEditor],
  exports: [TitleEditorContent, TitleEditor],
})
export class TitleEditorModule {
}

import { NgxSequenceViewerComponent } from '@ngx-sequence-viewer';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Define FASTA file content
const FASTA = `>unit.1.fasta
RFSIAYWHTFTADGTDQFGKATMQRPWNHYTDPMDIA---KARVEAAFEFFDKIN-----
--------
>unit.7.fasta
----GV------LGSIDANTGDMLLGWDTDQFPTDIRMT----TLAMYEVIKMGG-----
--------
>unit.2.fasta
---APY-FCFH-DRDIAPEGDTLRET------------------------NKNLDTIVAM
IKDYLKTS
>unit.3.fasta
-KTKVLWGTAN-----LFSNPRFVHGAS-TSCNADVFAYSAAQVKKALEITKELG-----
--------
>unit.6.fasta
-DKY------------FKVNIEANH----ATLAFHDF------QH-ELRYARIN------
--------
>unit.5.fasta
----------F-EGQFLIE-PKPKEP---TK---HQY---DFDVANVLAFLRKYDL----
--------
>unit.4.fasta
GENYVFWGGREGYETLLNTDMEFE------LDNFARF------LHMAVDYAKEIG-----
--------
>unit.8.fasta
---------FD-KGGLNFD-AKVRRA---SFEPEDLF---LGHIAGMDAFAKGFKVAYKL
VKD-----`;

@Component({
  selector: 'app-page-sequence-viewer',
  standalone: true,
  imports: [
    NgxSequenceViewerComponent,
    CommonModule,
  ],
  templateUrl: './page-sequence-viewer.component.html',
  styleUrl: './page-sequence-viewer.component.scss'
})
export class PageSequenceViewerComponent {

  readonly source = { type: 'local', data: FASTA };

}

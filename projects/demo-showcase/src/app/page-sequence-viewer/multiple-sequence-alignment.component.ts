import { ThemeSelectorService } from '../theme-selector/theme-selector.service';
import { Locus, Settings } from '@ngx-sequence-viewer';
import { Component, EventEmitter } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';


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
  selector: 'app-multiple-sequence-alignment',
  templateUrl: './multiple-sequence-alignment.component.html',
  styleUrl: './multiple-sequence-alignment.component.scss'
})
export class MultipleSequenceAlignmentComponent {

  readonly fasta = FASTA;

  readonly loci = [
    { start: 20, end: 30, 'background-color': '#648FFF' },
    { start: 40, end: 50, 'background-color': '#FE6100' },
    { start: 60, end: 70, 'background-color': '#648FFF' },
  ];

  // Define the sequence viewer configuration
  public settings$: Observable<Partial<Settings>>;

  // Define emitter for selected locus
  public selected$ = new EventEmitter<Locus>();

  // Dependency injection
  constructor(public themeSelectorService: ThemeSelectorService) {
    // Define theme retrieval pipeline
    const theme$ = this.themeSelectorService.theme$;
    // Define the settings observable
    this.settings$ = theme$.pipe(
      // Get theme from document
      map(() => document.documentElement.getAttribute('data-bs-theme') as 'dark' | 'light'),
      // Map theme to settings
      map((theme) => {
        // Case theme is dark
        if (theme === 'dark') {
          // Then return dark parameters
          return { 
            'background-color': '#212529', 
            'text-color': 'white',
            'chunk-size': -1,
          };
        }
        // Otherwise, return light parameters
        return {
          'background-color': '#FFFFFF',
          'text-color': 'black',
          'chunk-size': -1,
        }
      }),
      // Cache results
      shareReplay(1),
    );
  }

  public onSelected(locus: Locus) {
    // Just emit selected value
    this.selected$.emit(locus);
  }

}

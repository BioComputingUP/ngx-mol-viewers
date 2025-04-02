'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">ngx-structure-viewer documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/NgxFeaturesViewerComponent.html" data-type="entity-link" >NgxFeaturesViewerComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/NgxFeaturesViewerLabelDirective.html" data-type="entity-link" >NgxFeaturesViewerLabelDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/NgxFeaturesViewerTooltipDirective.html" data-type="entity-link" >NgxFeaturesViewerTooltipDirective</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/DrawService.html" data-type="entity-link" >DrawService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeaturesService.html" data-type="entity-link" >FeaturesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InitializeService.html" data-type="entity-link" >InitializeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ResizeService.html" data-type="entity-link" >ResizeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TooltipService.html" data-type="entity-link" >TooltipService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZoomService.html" data-type="entity-link" >ZoomService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Axes.html" data-type="entity-link" >Axes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BaseFeature.html" data-type="entity-link" >BaseFeature</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentSettings.html" data-type="entity-link" >ContentSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Context.html" data-type="entity-link" >Context</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Continuous.html" data-type="entity-link" >Continuous</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DSSP.html" data-type="entity-link" >DSSP</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InternalTrace.html" data-type="entity-link" >InternalTrace</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Locus.html" data-type="entity-link" >Locus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Margin.html" data-type="entity-link" >Margin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pin.html" data-type="entity-link" >Pin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Poly.html" data-type="entity-link" >Poly</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Scale.html" data-type="entity-link" >Scale</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectionContext.html" data-type="entity-link" >SelectionContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Settings.html" data-type="entity-link" >Settings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Size.html" data-type="entity-link" >Size</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TraceSettings.html" data-type="entity-link" >TraceSettings</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
import { ChangeDetectorRef, Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';
import { EMPTY, from, isObservable } from 'rxjs';
import { debounceTime, filter, mergeMap, switchMap, tap, toArray } from 'rxjs/operators';
import { TypeaheadContainerComponent } from './typeahead-container.component';
import { TypeaheadMatch } from './typeahead-match.class';
import { getValueFromObject, latinize, tokenize } from './typeahead-utils';
import { TypeaheadConfig } from './typeahead.config';
import * as i0 from "@angular/core";
import * as i1 from "ngx-bootstrap/component-loader";
import * as i2 from "./typeahead.config";
import * as i3 from "@angular/forms";
export class TypeaheadDirective {
    constructor(cis, config, changeDetection, element, ngControl, renderer, viewContainerRef) {
        this.changeDetection = changeDetection;
        this.element = element;
        this.ngControl = ngControl;
        this.renderer = renderer;
        /** minimal no of characters that needs to be entered before
         * typeahead kicks-in. When set to 0, typeahead shows on focus with full
         * list of options (limited as normal by typeaheadOptionsLimit)
         */
        this.typeaheadMinLength = 1;
        /** sets use adaptive position */
        this.adaptivePosition = false;
        /** turn on/off animation */
        this.isAnimated = false;
        /** minimal wait time after last character typed before typeahead kicks-in */
        this.typeaheadWaitMs = 0;
        /** match latin symbols.
         * If true the word súper would match super and vice versa.
         */
        this.typeaheadLatinize = true;
        /** Can be use to search words by inserting a single white space between each characters
         *  for example 'C a l i f o r n i a' will match 'California'.
         */
        this.typeaheadSingleWords = true;
        /** should be used only in case typeaheadSingleWords attribute is true.
         * Sets the word delimiter to break words. Defaults to space.
         */
        this.typeaheadWordDelimiters = ' ';
        /** should be used only in case typeaheadMultipleSearch attribute is true.
         * Sets the multiple search delimiter to know when to start a new search. Defaults to comma.
         * If space needs to be used, then explicitly set typeaheadWordDelimiters to something else than space
         * because space is used by default OR set typeaheadSingleWords attribute to false if you don't need
         * to use it together with multiple search.
         */
        this.typeaheadMultipleSearchDelimiters = ',';
        /** should be used only in case typeaheadSingleWords attribute is true.
         * Sets the word delimiter to match exact phrase.
         * Defaults to simple and double quotes.
         */
        this.typeaheadPhraseDelimiters = '\'"';
        /** specifies if typeahead is scrollable  */
        this.typeaheadScrollable = false;
        /** specifies number of options to show in scroll view  */
        this.typeaheadOptionsInScrollableView = 5;
        /** fired when an options list was opened and the user clicked Tab
         * If a value equal true, it will be chosen first or active item in the list
         * If value equal false, it will be chosen an active item in the list or nothing
         */
        this.typeaheadSelectFirstItem = true;
        /** makes active first item in a list */
        this.typeaheadIsFirstItemActive = true;
        /** fired when 'busy' state of this component was changed,
         * fired on async mode only, returns boolean
         */
        this.typeaheadLoading = new EventEmitter();
        /** fired on every key event and returns true
         * in case of matches are not detected
         */
        this.typeaheadNoResults = new EventEmitter();
        /** fired when option was selected, return object with data of this option. */
        this.typeaheadOnSelect = new EventEmitter();
        /** fired when option was previewed, return object with data of this option. */
        this.typeaheadOnPreview = new EventEmitter();
        /** fired when blur event occurs. returns the active item */
        this.typeaheadOnBlur = new EventEmitter();
        /** This attribute indicates that the dropdown should be opened upwards */
        this.dropup = false;
        this.isOpen = false;
        this.list = 'list';
        this.isActiveItemChanged = false;
        this.isFocused = false;
        this.cancelRequestOnFocusLost = false;
        this.selectItemOnBlur = false;
        this.keyUpEventEmitter = new EventEmitter();
        this.placement = 'bottom left';
        this._matches = [];
        this._subscriptions = [];
        this._outsideClickListener = () => void 0;
        this._typeahead = cis
            .createLoader(element, viewContainerRef, renderer)
            .provide({ provide: TypeaheadConfig, useValue: config });
        Object.assign(this, {
            typeaheadHideResultsOnBlur: config.hideResultsOnBlur,
            cancelRequestOnFocusLost: config.cancelRequestOnFocusLost,
            typeaheadSelectFirstItem: config.selectFirstItem,
            typeaheadIsFirstItemActive: config.isFirstItemActive,
            typeaheadMinLength: config.minLength,
            adaptivePosition: config.adaptivePosition,
            isAnimated: config.isAnimated,
            selectItemOnBlur: config.selectItemOnBlur
        });
    }
    get matches() {
        return this._matches;
    }
    ngOnInit() {
        this.typeaheadOptionsLimit = this.typeaheadOptionsLimit || 20;
        this.typeaheadMinLength = this.typeaheadMinLength === void 0 ? 1 : this.typeaheadMinLength;
        // async should be false in case of array
        if (this.typeaheadAsync === undefined && !isObservable(this.typeahead)) {
            this.typeaheadAsync = false;
        }
        if (isObservable(this.typeahead)) {
            this.typeaheadAsync = true;
        }
        if (this.typeaheadAsync) {
            this.asyncActions();
        }
        else {
            this.syncActions();
        }
        this.checkDelimitersConflict();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onInput(e) {
        // For `<input>`s, use the `value` property. For others that don't have a
        // `value` (such as `<span contenteditable="true">`), use either
        // `textContent` or `innerText` (depending on which one is supported, i.e.
        // Firefox or IE).
        const value = e.target.value !== undefined
            ? e.target.value
            : e.target.textContent !== undefined
                ? e.target.textContent
                : e.target.innerText;
        if (value != null && value.trim().length >= this.typeaheadMinLength) {
            this.typeaheadLoading.emit(true);
            this.keyUpEventEmitter.emit(e.target.value);
        }
        else {
            this.typeaheadLoading.emit(false);
            this.typeaheadNoResults.emit(false);
            this.hide();
        }
    }
    onChange(event) {
        if (this._container) {
            // esc
            if (event.keyCode === 27 || event.key === 'Escape') {
                this.hide();
                return;
            }
            // up
            if (event.keyCode === 38 || event.key === 'ArrowUp') {
                this.isActiveItemChanged = true;
                this._container.prevActiveMatch();
                return;
            }
            // down
            if (event.keyCode === 40 || event.key === 'ArrowDown') {
                this.isActiveItemChanged = true;
                this._container.nextActiveMatch();
                return;
            }
            // enter
            if (event.keyCode === 13 || event.key === 'Enter') {
                this._container.selectActiveMatch();
                return;
            }
        }
    }
    onFocus() {
        this.isFocused = true;
        // add setTimeout to fix issue #5251
        // to get and emit updated value if it's changed on focus
        setTimeout(() => {
            if (this.typeaheadMinLength === 0) {
                this.typeaheadLoading.emit(true);
                this.keyUpEventEmitter.emit(this.element.nativeElement.value || '');
            }
        }, 0);
    }
    onBlur() {
        this.isFocused = false;
        if (this._container && !this._container.isFocused) {
            this.typeaheadOnBlur.emit(this._container.active);
        }
        if (!this.container && this._matches?.length === 0) {
            this.typeaheadOnBlur.emit(new TypeaheadMatch(this.element.nativeElement.value, this.element.nativeElement.value, false));
        }
    }
    onKeydown(event) {
        // no container - no problems
        if (!this._container) {
            return;
        }
        if (event.keyCode === 9 || event.key === 'Tab') {
            this.onBlur();
        }
        if (event.keyCode === 9 || event.key === 'Tab' || event.keyCode === 13 || event.key === 'Enter') {
            event.preventDefault();
            if (this.typeaheadSelectFirstItem) {
                this._container.selectActiveMatch();
                return;
            }
            if (!this.typeaheadSelectFirstItem) {
                this._container.selectActiveMatch(this.isActiveItemChanged);
                this.isActiveItemChanged = false;
                this.hide();
            }
        }
    }
    changeModel(match) {
        if (!match) {
            return;
        }
        let valueStr;
        if (this.typeaheadMultipleSearch && this._allEnteredValue) {
            const tokens = this._allEnteredValue.split(new RegExp(`([${this.typeaheadMultipleSearchDelimiters}]+)`));
            this._allEnteredValue = tokens
                .slice(0, tokens.length - 1)
                .concat(match.value)
                .join('');
            valueStr = this._allEnteredValue;
        }
        else {
            valueStr = match.value;
        }
        this.ngControl.viewToModelUpdate(valueStr);
        this.ngControl.control?.setValue(valueStr);
        this.changeDetection.markForCheck();
        this.hide();
    }
    show() {
        this._typeahead
            .attach(TypeaheadContainerComponent)
            .to(this.container)
            .position({ attachment: `${this.dropup ? 'top' : 'bottom'} left` })
            .show({
            typeaheadRef: this,
            placement: this.placement,
            animation: false,
            dropup: this.dropup
        });
        this._outsideClickListener = this.renderer.listen('document', 'click', (event) => {
            if (this.typeaheadMinLength === 0 && this.element.nativeElement.contains(event.target)) {
                return;
            }
            if (!this.typeaheadHideResultsOnBlur || this.element.nativeElement.contains(event.target)) {
                return;
            }
            this.onOutsideClick();
        });
        if (!this._typeahead.instance || !this.ngControl.control) {
            return;
        }
        this._container = this._typeahead.instance;
        this._container.parent = this;
        // This improves the speed as it won't have to be done for each list item
        const normalizedQuery = (this.typeaheadLatinize ? latinize(this.ngControl.control.value) : this.ngControl.control.value)
            .toString()
            .toLowerCase();
        this._container.query = this.tokenizeQuery(normalizedQuery);
        this._container.matches = this._matches;
        this.element.nativeElement.focus();
        this._container.activeChangeEvent.subscribe((activeId) => {
            this.activeDescendant = activeId;
            this.changeDetection.markForCheck();
        });
        this.isOpen = true;
    }
    hide() {
        if (this._typeahead.isShown) {
            this._typeahead.hide();
            this._outsideClickListener();
            this._container = void 0;
            this.isOpen = false;
            this.changeDetection.markForCheck();
        }
        this.typeaheadOnPreview.emit();
    }
    onOutsideClick() {
        if (this._container && !this._container.isFocused) {
            this.hide();
        }
    }
    ngOnDestroy() {
        // clean up subscriptions
        for (const sub of this._subscriptions) {
            sub.unsubscribe();
        }
        this._typeahead.dispose();
    }
    asyncActions() {
        this._subscriptions.push(this.keyUpEventEmitter
            .pipe(debounceTime(this.typeaheadWaitMs), tap((value) => (this._allEnteredValue = value)), switchMap(() => {
            if (!this.typeahead) {
                return EMPTY;
            }
            return this.typeahead;
        }))
            .subscribe((matches) => {
            this.finalizeAsyncCall(matches);
        }));
    }
    syncActions() {
        this._subscriptions.push(this.keyUpEventEmitter
            .pipe(debounceTime(this.typeaheadWaitMs), mergeMap((value) => {
            this._allEnteredValue = value;
            const normalizedQuery = this.normalizeQuery(value);
            if (!this.typeahead) {
                return EMPTY;
            }
            const typeahead = isObservable(this.typeahead) ? this.typeahead : from(this.typeahead);
            return typeahead.pipe(filter((option) => {
                return !!option && this.testMatch(this.normalizeOption(option), normalizedQuery);
            }), toArray());
        }))
            .subscribe((matches) => {
            this.finalizeAsyncCall(matches);
        }));
    }
    normalizeOption(option) {
        const optionValue = getValueFromObject(option, this.typeaheadOptionField);
        const normalizedOption = this.typeaheadLatinize ? latinize(optionValue) : optionValue;
        return normalizedOption.toLowerCase();
    }
    tokenizeQuery(currentQuery) {
        let query = currentQuery;
        if (this.typeaheadMultipleSearch && this.typeaheadSingleWords) {
            if (!this.haveCommonCharacters(`${this.typeaheadPhraseDelimiters}${this.typeaheadWordDelimiters}`, this.typeaheadMultipleSearchDelimiters)) {
                // single words and multiple search delimiters are different, can be used together
                query = tokenize(query, this.typeaheadWordDelimiters, this.typeaheadPhraseDelimiters, this.typeaheadMultipleSearchDelimiters);
            }
        }
        else if (this.typeaheadSingleWords) {
            query = tokenize(query, this.typeaheadWordDelimiters, this.typeaheadPhraseDelimiters);
        }
        else {
            // multiple searches
            query = tokenize(query, void 0, void 0, this.typeaheadMultipleSearchDelimiters);
        }
        return query;
    }
    normalizeQuery(value) {
        // If singleWords, break model here to not be doing extra work on each iteration
        let normalizedQuery = (this.typeaheadLatinize ? latinize(value) : value)
            .toString()
            .toLowerCase();
        normalizedQuery = this.tokenizeQuery(normalizedQuery);
        return normalizedQuery;
    }
    testMatch(match, test) {
        let spaceLength;
        if (typeof test === 'object') {
            spaceLength = test.length;
            for (let i = 0; i < spaceLength; i += 1) {
                if (test[i].length > 0 && match.indexOf(test[i]) < 0) {
                    return false;
                }
            }
            return true;
        }
        return match.indexOf(test) >= 0;
    }
    finalizeAsyncCall(matches) {
        this.prepareMatches(matches || []);
        this.typeaheadLoading.emit(false);
        this.typeaheadNoResults.emit(!this.hasMatches());
        if (!this.hasMatches()) {
            this.hide();
            return;
        }
        if (!this.isFocused && this.cancelRequestOnFocusLost) {
            return;
        }
        if (this._container && this.ngControl.control) {
            // fix: remove usage of ngControl internals
            const _controlValue = (this.typeaheadLatinize ? latinize(this.ngControl.control.value) : this.ngControl.control.value) || '';
            // This improves the speed as it won't have to be done for each list item
            const normalizedQuery = _controlValue.toString().toLowerCase();
            this._container.query = this.tokenizeQuery(normalizedQuery);
            this._container.matches = this._matches;
        }
        else {
            this.show();
        }
    }
    prepareMatches(options) {
        const limited = options.slice(0, this.typeaheadOptionsLimit);
        const sorted = !this.typeaheadOrderBy ? limited : this.orderMatches(limited);
        if (this.typeaheadGroupField) {
            let matches = [];
            // extract all group names
            const groups = sorted
                .map((option) => getValueFromObject(option, this.typeaheadGroupField))
                .filter((v, i, a) => a.indexOf(v) === i);
            groups.forEach((group) => {
                // add group header to array of matches
                matches.push(new TypeaheadMatch(group, group, true));
                // add each item of group to array of matches
                matches = matches.concat(sorted
                    .filter((option) => getValueFromObject(option, this.typeaheadGroupField) === group)
                    .map((option) => new TypeaheadMatch(option, getValueFromObject(option, this.typeaheadOptionField))));
            });
            this._matches = matches;
        }
        else {
            this._matches = sorted.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (option) => new TypeaheadMatch(option, getValueFromObject(option, this.typeaheadOptionField)));
        }
    }
    orderMatches(options) {
        if (!options.length) {
            return options;
        }
        if (this.typeaheadOrderBy !== null &&
            this.typeaheadOrderBy !== undefined &&
            typeof this.typeaheadOrderBy === 'object' &&
            Object.keys(this.typeaheadOrderBy).length === 0) {
            console.error('Field and direction properties for typeaheadOrderBy have to be set according to documentation!');
            return options;
        }
        const { field, direction } = this.typeaheadOrderBy || {};
        if (!direction || !(direction === 'asc' || direction === 'desc')) {
            console.error('typeaheadOrderBy direction has to equal "asc" or "desc". Please follow the documentation.');
            return options;
        }
        if (typeof options[0] === 'string') {
            return direction === 'asc' ? options.sort() : options.sort().reverse();
        }
        if (!field || typeof field !== 'string') {
            console.error('typeaheadOrderBy field has to set according to the documentation.');
            return options;
        }
        return options.sort((a, b) => {
            const stringA = getValueFromObject(a, field);
            const stringB = getValueFromObject(b, field);
            if (stringA < stringB) {
                return direction === 'asc' ? -1 : 1;
            }
            if (stringA > stringB) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    hasMatches() {
        return this._matches.length > 0;
    }
    checkDelimitersConflict() {
        if (this.typeaheadMultipleSearch &&
            this.typeaheadSingleWords &&
            this.haveCommonCharacters(`${this.typeaheadPhraseDelimiters}${this.typeaheadWordDelimiters}`, this.typeaheadMultipleSearchDelimiters)) {
            throw new Error(`Delimiters used in typeaheadMultipleSearchDelimiters must be different
          from delimiters used in typeaheadWordDelimiters (current value: ${this.typeaheadWordDelimiters}) and
          typeaheadPhraseDelimiters (current value: ${this.typeaheadPhraseDelimiters}).
          Please refer to the documentation`);
        }
    }
    haveCommonCharacters(str1, str2) {
        for (let i = 0; i < str1.length; i++) {
            if (str1.charAt(i).indexOf(str2) > -1) {
                return true;
            }
        }
        return false;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: TypeaheadDirective, deps: [{ token: i1.ComponentLoaderFactory }, { token: i2.TypeaheadConfig }, { token: i0.ChangeDetectorRef }, { token: i0.ElementRef }, { token: i3.NgControl }, { token: i0.Renderer2 }, { token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.4", type: TypeaheadDirective, selector: "[typeahead]", inputs: { typeahead: "typeahead", typeaheadMinLength: "typeaheadMinLength", adaptivePosition: "adaptivePosition", isAnimated: "isAnimated", typeaheadWaitMs: "typeaheadWaitMs", typeaheadOptionsLimit: "typeaheadOptionsLimit", typeaheadOptionField: "typeaheadOptionField", typeaheadGroupField: "typeaheadGroupField", typeaheadOrderBy: "typeaheadOrderBy", typeaheadAsync: "typeaheadAsync", typeaheadLatinize: "typeaheadLatinize", typeaheadSingleWords: "typeaheadSingleWords", typeaheadWordDelimiters: "typeaheadWordDelimiters", typeaheadMultipleSearch: "typeaheadMultipleSearch", typeaheadMultipleSearchDelimiters: "typeaheadMultipleSearchDelimiters", typeaheadPhraseDelimiters: "typeaheadPhraseDelimiters", typeaheadItemTemplate: "typeaheadItemTemplate", optionsListTemplate: "optionsListTemplate", typeaheadScrollable: "typeaheadScrollable", typeaheadOptionsInScrollableView: "typeaheadOptionsInScrollableView", typeaheadHideResultsOnBlur: "typeaheadHideResultsOnBlur", typeaheadSelectFirstItem: "typeaheadSelectFirstItem", typeaheadIsFirstItemActive: "typeaheadIsFirstItemActive", container: "container", dropup: "dropup" }, outputs: { typeaheadLoading: "typeaheadLoading", typeaheadNoResults: "typeaheadNoResults", typeaheadOnSelect: "typeaheadOnSelect", typeaheadOnPreview: "typeaheadOnPreview", typeaheadOnBlur: "typeaheadOnBlur" }, host: { listeners: { "input": "onInput($event)", "keyup": "onChange($event)", "click": "onFocus()", "focus": "onFocus()", "blur": "onBlur()", "keydown": "onKeydown($event)" }, properties: { "attr.aria-activedescendant": "activeDescendant", "attr.aria-owns": "isOpen ? this._container.popupId : null", "attr.aria-expanded": "isOpen", "attr.aria-autocomplete": "list" } }, exportAs: ["bs-typeahead"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: TypeaheadDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[typeahead]',
                    exportAs: 'bs-typeahead',
                    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
                    host: {
                        '[attr.aria-activedescendant]': 'activeDescendant',
                        '[attr.aria-owns]': 'isOpen ? this._container.popupId : null',
                        '[attr.aria-expanded]': 'isOpen',
                        '[attr.aria-autocomplete]': 'list'
                    }
                }]
        }], ctorParameters: () => [{ type: i1.ComponentLoaderFactory }, { type: i2.TypeaheadConfig }, { type: i0.ChangeDetectorRef }, { type: i0.ElementRef }, { type: i3.NgControl }, { type: i0.Renderer2 }, { type: i0.ViewContainerRef }], propDecorators: { typeahead: [{
                type: Input
            }], typeaheadMinLength: [{
                type: Input
            }], adaptivePosition: [{
                type: Input
            }], isAnimated: [{
                type: Input
            }], typeaheadWaitMs: [{
                type: Input
            }], typeaheadOptionsLimit: [{
                type: Input
            }], typeaheadOptionField: [{
                type: Input
            }], typeaheadGroupField: [{
                type: Input
            }], typeaheadOrderBy: [{
                type: Input
            }], typeaheadAsync: [{
                type: Input
            }], typeaheadLatinize: [{
                type: Input
            }], typeaheadSingleWords: [{
                type: Input
            }], typeaheadWordDelimiters: [{
                type: Input
            }], typeaheadMultipleSearch: [{
                type: Input
            }], typeaheadMultipleSearchDelimiters: [{
                type: Input
            }], typeaheadPhraseDelimiters: [{
                type: Input
            }], typeaheadItemTemplate: [{
                type: Input
            }], optionsListTemplate: [{
                type: Input
            }], typeaheadScrollable: [{
                type: Input
            }], typeaheadOptionsInScrollableView: [{
                type: Input
            }], typeaheadHideResultsOnBlur: [{
                type: Input
            }], typeaheadSelectFirstItem: [{
                type: Input
            }], typeaheadIsFirstItemActive: [{
                type: Input
            }], typeaheadLoading: [{
                type: Output
            }], typeaheadNoResults: [{
                type: Output
            }], typeaheadOnSelect: [{
                type: Output
            }], typeaheadOnPreview: [{
                type: Output
            }], typeaheadOnBlur: [{
                type: Output
            }], container: [{
                type: Input
            }], dropup: [{
                type: Input
            }], 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput: [{
                type: HostListener,
                args: ['input', ['$event']]
            }], onChange: [{
                type: HostListener,
                args: ['keyup', ['$event']]
            }], onFocus: [{
                type: HostListener,
                args: ['click']
            }, {
                type: HostListener,
                args: ['focus']
            }], onBlur: [{
                type: HostListener,
                args: ['blur']
            }], onKeydown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZWFoZWFkLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90eXBlYWhlYWQvdHlwZWFoZWFkLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBR0wsTUFBTSxFQUNOLFNBQVMsRUFDVCxXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQW1CLHNCQUFzQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFekYsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUE0QixNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUd6RixPQUFPLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUM5RSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMzRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7Ozs7O0FBaUJyRCxNQUFNLE9BQU8sa0JBQWtCO0lBZ0o3QixZQUNFLEdBQTJCLEVBQzNCLE1BQXVCLEVBQ2YsZUFBa0MsRUFDbEMsT0FBbUIsRUFDbkIsU0FBb0IsRUFDcEIsUUFBbUIsRUFDM0IsZ0JBQWtDO1FBSjFCLG9CQUFlLEdBQWYsZUFBZSxDQUFtQjtRQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25C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QyxLQUFLO2dCQUlHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFJRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBRUcsbUJBQW1CO3NCQUEzQixLQUFLO2dCQUVHLGdDQUFnQztzQkFBeEMsS0FBSztnQkFFRywwQkFBMEI7c0JBQWxDLEtBQUs7Z0JBS0csd0JBQXdCO3NCQUFoQyxLQUFLO2dCQUVHLDBCQUEwQjtzQkFBbEMsS0FBSztnQkFJSSxnQkFBZ0I7c0JBQXpCLE1BQU07Z0JBSUcsa0JBQWtCO3NCQUEzQixNQUFNO2dCQUVHLGlCQUFpQjtzQkFBMUIsTUFBTTtnQkFFRyxrQkFBa0I7c0JBQTNCLE1BQU07Z0JBRUcsZUFBZTtzQkFBeEIsTUFBTTtnQkFLRSxTQUFTO3NCQUFqQixLQUFLO2dCQUdHLE1BQU07c0JBQWQsS0FBSzs7UUFzRk4sOERBQThEO1FBQzlELE9BQU87c0JBRk4sWUFBWTt1QkFBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBeUJqQyxRQUFRO3NCQURQLFlBQVk7dUJBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQXFDakMsT0FBTztzQkFGTixZQUFZO3VCQUFDLE9BQU87O3NCQUNwQixZQUFZO3VCQUFDLE9BQU87Z0JBY3JCLE1BQU07c0JBREwsWUFBWTt1QkFBQyxNQUFNO2dCQWVwQixTQUFTO3NCQURSLFlBQVk7dUJBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0TGlzdGVuZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBSZW5kZXJlcjIsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q29udGFpbmVyUmVmXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmdDb250cm9sIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50TG9hZGVyLCBDb21wb25lbnRMb2FkZXJGYWN0b3J5IH0gZnJvbSAnbmd4LWJvb3RzdHJhcC9jb21wb25lbnQtbG9hZGVyJztcblxuaW1wb3J0IHsgRU1QVFksIGZyb20sIGlzT2JzZXJ2YWJsZSwgT2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUsIGZpbHRlciwgbWVyZ2VNYXAsIHN3aXRjaE1hcCwgdGFwLCB0b0FycmF5IH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVHlwZWFoZWFkT3B0aW9uSXRlbUNvbnRleHQsIFR5cGVhaGVhZE9wdGlvbkxpc3RDb250ZXh0IH0gZnJvbSAnLi9tb2RlbHMnO1xuXG5pbXBvcnQgeyBUeXBlYWhlYWRDb250YWluZXJDb21wb25lbnQgfSBmcm9tICcuL3R5cGVhaGVhZC1jb250YWluZXIuY29tcG9uZW50JztcbmltcG9ydCB7IFR5cGVhaGVhZE1hdGNoIH0gZnJvbSAnLi90eXBlYWhlYWQtbWF0Y2guY2xhc3MnO1xuaW1wb3J0IHsgVHlwZWFoZWFkT3JkZXIgfSBmcm9tICcuL3R5cGVhaGVhZC1vcmRlci5jbGFzcyc7XG5pbXBvcnQgeyBnZXRWYWx1ZUZyb21PYmplY3QsIGxhdGluaXplLCB0b2tlbml6ZSB9IGZyb20gJy4vdHlwZWFoZWFkLXV0aWxzJztcbmltcG9ydCB7IFR5cGVhaGVhZENvbmZpZyB9IGZyb20gJy4vdHlwZWFoZWFkLmNvbmZpZyc7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxudHlwZSBUeXBlYWhlYWRPcHRpb24gPSBzdHJpbmcgfCBSZWNvcmQ8c3RyaW5nIHwgbnVtYmVyLCBhbnk+O1xudHlwZSBUeXBlYWhlYWRPcHRpb25BcnIgPSBUeXBlYWhlYWRPcHRpb25bXSB8IE9ic2VydmFibGU8VHlwZWFoZWFkT3B0aW9uPjtcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3R5cGVhaGVhZF0nLFxuICBleHBvcnRBczogJ2JzLXR5cGVhaGVhZCcsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAYW5ndWxhci1lc2xpbnQvbm8taG9zdC1tZXRhZGF0YS1wcm9wZXJ0eVxuICBob3N0OiB7XG4gICAgJ1thdHRyLmFyaWEtYWN0aXZlZGVzY2VuZGFudF0nOiAnYWN0aXZlRGVzY2VuZGFudCcsXG4gICAgJ1thdHRyLmFyaWEtb3duc10nOiAnaXNPcGVuID8gdGhpcy5fY29udGFpbmVyLnBvcHVwSWQgOiBudWxsJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnaXNPcGVuJyxcbiAgICAnW2F0dHIuYXJpYS1hdXRvY29tcGxldGVdJzogJ2xpc3QnXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgVHlwZWFoZWFkRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICAvKiogb3B0aW9ucyBzb3VyY2UsIGNhbiBiZSBBcnJheSBvZiBzdHJpbmdzLCBvYmplY3RzIG9yXG4gICAqIGFuIE9ic2VydmFibGUgZm9yIGV4dGVybmFsIG1hdGNoaW5nIHByb2Nlc3NcbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZD86IFR5cGVhaGVhZE9wdGlvbkFycjtcbiAgLyoqIG1pbmltYWwgbm8gb2YgY2hhcmFjdGVycyB0aGF0IG5lZWRzIHRvIGJlIGVudGVyZWQgYmVmb3JlXG4gICAqIHR5cGVhaGVhZCBraWNrcy1pbi4gV2hlbiBzZXQgdG8gMCwgdHlwZWFoZWFkIHNob3dzIG9uIGZvY3VzIHdpdGggZnVsbFxuICAgKiBsaXN0IG9mIG9wdGlvbnMgKGxpbWl0ZWQgYXMgbm9ybWFsIGJ5IHR5cGVhaGVhZE9wdGlvbnNMaW1pdClcbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZE1pbkxlbmd0aCA9IDE7XG4gIC8qKiBzZXRzIHVzZSBhZGFwdGl2ZSBwb3NpdGlvbiAqL1xuICBASW5wdXQoKSBhZGFwdGl2ZVBvc2l0aW9uID0gZmFsc2U7XG4gIC8qKiB0dXJuIG9uL29mZiBhbmltYXRpb24gKi9cbiAgQElucHV0KCkgaXNBbmltYXRlZCA9IGZhbHNlO1xuICAvKiogbWluaW1hbCB3YWl0IHRpbWUgYWZ0ZXIgbGFzdCBjaGFyYWN0ZXIgdHlwZWQgYmVmb3JlIHR5cGVhaGVhZCBraWNrcy1pbiAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRXYWl0TXMgPSAwO1xuICAvKiogbWF4aW11bSBsZW5ndGggb2Ygb3B0aW9ucyBpdGVtcyBsaXN0LiBUaGUgZGVmYXVsdCB2YWx1ZSBpcyAyMCAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRPcHRpb25zTGltaXQ/OiBudW1iZXI7XG4gIC8qKiB3aGVuIG9wdGlvbnMgc291cmNlIGlzIGFuIGFycmF5IG9mIG9iamVjdHMsIHRoZSBuYW1lIG9mIGZpZWxkXG4gICAqIHRoYXQgY29udGFpbnMgdGhlIG9wdGlvbnMgdmFsdWUsIHdlIHVzZSBhcnJheSBpdGVtIGFzIG9wdGlvbiBpbiBjYXNlXG4gICAqIG9mIHRoaXMgZmllbGQgaXMgbWlzc2luZy4gU3VwcG9ydHMgbmVzdGVkIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gICAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRPcHRpb25GaWVsZD86IHN0cmluZztcbiAgLyoqIHdoZW4gb3B0aW9ucyBzb3VyY2UgaXMgYW4gYXJyYXkgb2Ygb2JqZWN0cywgdGhlIG5hbWUgb2YgZmllbGQgdGhhdFxuICAgKiBjb250YWlucyB0aGUgZ3JvdXAgdmFsdWUsIG1hdGNoZXMgYXJlIGdyb3VwZWQgYnkgdGhpcyBmaWVsZCB3aGVuIHNldC5cbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZEdyb3VwRmllbGQ/OiBzdHJpbmc7XG4gIC8qKiBVc2VkIHRvIHNwZWNpZnkgYSBjdXN0b20gb3JkZXIgb2YgbWF0Y2hlcy4gV2hlbiBvcHRpb25zIHNvdXJjZSBpcyBhbiBhcnJheSBvZiBvYmplY3RzXG4gICAqIGEgZmllbGQgZm9yIHNvcnRpbmcgaGFzIHRvIGJlIHNldCB1cC4gSW4gY2FzZSBvZiBvcHRpb25zIHNvdXJjZSBpcyBhbiBhcnJheSBvZiBzdHJpbmcsXG4gICAqIGEgZmllbGQgZm9yIHNvcnRpbmcgaXMgYWJzZW50LiBUaGUgb3JkZXJpbmcgZGlyZWN0aW9uIGNvdWxkIGJlIGNoYW5nZWQgdG8gYXNjZW5kaW5nIG9yIGRlc2NlbmRpbmcuXG4gICAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRPcmRlckJ5PzogVHlwZWFoZWFkT3JkZXI7XG4gIC8qKiBzaG91bGQgYmUgdXNlZCBvbmx5IGluIGNhc2Ugb2YgdHlwZWFoZWFkIGF0dHJpYnV0ZSBpcyBPYnNlcnZhYmxlIG9mIGFycmF5LlxuICAgKiBJZiB0cnVlIC0gbG9hZGluZyBvZiBvcHRpb25zIHdpbGwgYmUgYXN5bmMsIG90aGVyd2lzZSAtIHN5bmMuXG4gICAqIHRydWUgbWFrZSBzZW5zZSBpZiBvcHRpb25zIGFycmF5IGlzIGxhcmdlLlxuICAgKi9cbiAgQElucHV0KCkgdHlwZWFoZWFkQXN5bmM/OiBib29sZWFuO1xuICAvKiogbWF0Y2ggbGF0aW4gc3ltYm9scy5cbiAgICogSWYgdHJ1ZSB0aGUgd29yZCBzw7pwZXIgd291bGQgbWF0Y2ggc3VwZXIgYW5kIHZpY2UgdmVyc2EuXG4gICAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRMYXRpbml6ZSA9IHRydWU7XG4gIC8qKiBDYW4gYmUgdXNlIHRvIHNlYXJjaCB3b3JkcyBieSBpbnNlcnRpbmcgYSBzaW5nbGUgd2hpdGUgc3BhY2UgYmV0d2VlbiBlYWNoIGNoYXJhY3RlcnNcbiAgICogIGZvciBleGFtcGxlICdDIGEgbCBpIGYgbyByIG4gaSBhJyB3aWxsIG1hdGNoICdDYWxpZm9ybmlhJy5cbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZFNpbmdsZVdvcmRzID0gdHJ1ZTtcbiAgLyoqIHNob3VsZCBiZSB1c2VkIG9ubHkgaW4gY2FzZSB0eXBlYWhlYWRTaW5nbGVXb3JkcyBhdHRyaWJ1dGUgaXMgdHJ1ZS5cbiAgICogU2V0cyB0aGUgd29yZCBkZWxpbWl0ZXIgdG8gYnJlYWsgd29yZHMuIERlZmF1bHRzIHRvIHNwYWNlLlxuICAgKi9cbiAgQElucHV0KCkgdHlwZWFoZWFkV29yZERlbGltaXRlcnMgPSAnICc7XG4gIC8qKiBDYW4gYmUgdXNlZCB0byBjb25kdWN0IGEgc2VhcmNoIG9mIG11bHRpcGxlIGl0ZW1zIGFuZCBoYXZlIHN1Z2dlc3Rpb24gbm90IGZvciB0aGVcbiAgICogd2hvbGUgdmFsdWUgb2YgdGhlIGlucHV0IGJ1dCBmb3IgdGhlIHZhbHVlIHRoYXQgY29tZXMgYWZ0ZXIgYSBkZWxpbWl0ZXIgcHJvdmlkZWQgdmlhXG4gICAqIHR5cGVhaGVhZE11bHRpcGxlU2VhcmNoRGVsaW1pdGVycyBhdHRyaWJ1dGUuIFRoaXMgb3B0aW9uIGNhbiBvbmx5IGJlIHVzZWQgdG9nZXRoZXIgd2l0aFxuICAgKiB0eXBlYWhlYWRTaW5nbGVXb3JkcyBvcHRpb24gaWYgdHlwZWFoZWFkV29yZERlbGltaXRlcnMgYW5kIHR5cGVhaGVhZFBocmFzZURlbGltaXRlcnNcbiAgICogYXJlIGRpZmZlcmVudCBmcm9tIHR5cGVhaGVhZE11bHRpcGxlU2VhcmNoRGVsaW1pdGVycyB0byBhdm9pZCBjb25mbGljdCBpbiBkZXRlcm1pbmluZ1xuICAgKiB3aGVuIHRvIGRlbGltaXQgbXVsdGlwbGUgc2VhcmNoZXMgYW5kIHdoZW4gYSBzaW5nbGUgd29yZC5cbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZE11bHRpcGxlU2VhcmNoPzogYm9vbGVhbjtcbiAgLyoqIHNob3VsZCBiZSB1c2VkIG9ubHkgaW4gY2FzZSB0eXBlYWhlYWRNdWx0aXBsZVNlYXJjaCBhdHRyaWJ1dGUgaXMgdHJ1ZS5cbiAgICogU2V0cyB0aGUgbXVsdGlwbGUgc2VhcmNoIGRlbGltaXRlciB0byBrbm93IHdoZW4gdG8gc3RhcnQgYSBuZXcgc2VhcmNoLiBEZWZhdWx0cyB0byBjb21tYS5cbiAgICogSWYgc3BhY2UgbmVlZHMgdG8gYmUgdXNlZCwgdGhlbiBleHBsaWNpdGx5IHNldCB0eXBlYWhlYWRXb3JkRGVsaW1pdGVycyB0byBzb21ldGhpbmcgZWxzZSB0aGFuIHNwYWNlXG4gICAqIGJlY2F1c2Ugc3BhY2UgaXMgdXNlZCBieSBkZWZhdWx0IE9SIHNldCB0eXBlYWhlYWRTaW5nbGVXb3JkcyBhdHRyaWJ1dGUgdG8gZmFsc2UgaWYgeW91IGRvbid0IG5lZWRcbiAgICogdG8gdXNlIGl0IHRvZ2V0aGVyIHdpdGggbXVsdGlwbGUgc2VhcmNoLlxuICAgKi9cbiAgQElucHV0KCkgdHlwZWFoZWFkTXVsdGlwbGVTZWFyY2hEZWxpbWl0ZXJzID0gJywnO1xuICAvKiogc2hvdWxkIGJlIHVzZWQgb25seSBpbiBjYXNlIHR5cGVhaGVhZFNpbmdsZVdvcmRzIGF0dHJpYnV0ZSBpcyB0cnVlLlxuICAgKiBTZXRzIHRoZSB3b3JkIGRlbGltaXRlciB0byBtYXRjaCBleGFjdCBwaHJhc2UuXG4gICAqIERlZmF1bHRzIHRvIHNpbXBsZSBhbmQgZG91YmxlIHF1b3Rlcy5cbiAgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZFBocmFzZURlbGltaXRlcnMgPSAnXFwnXCInO1xuICAvKiogdXNlZCB0byBzcGVjaWZ5IGEgY3VzdG9tIGl0ZW0gdGVtcGxhdGUuXG4gICAqIFRlbXBsYXRlIHZhcmlhYmxlcyBleHBvc2VkIGFyZSBjYWxsZWQgaXRlbSBhbmQgaW5kZXg7XG4gICAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRJdGVtVGVtcGxhdGU/OiBUZW1wbGF0ZVJlZjxUeXBlYWhlYWRPcHRpb25JdGVtQ29udGV4dD47XG4gIC8qKiB1c2VkIHRvIHNwZWNpZnkgYSBjdXN0b20gb3B0aW9ucyBsaXN0IHRlbXBsYXRlLlxuICAgKiBUZW1wbGF0ZSB2YXJpYWJsZXM6IG1hdGNoZXMsIGl0ZW1UZW1wbGF0ZSwgcXVlcnlcbiAgICovXG4gIEBJbnB1dCgpIG9wdGlvbnNMaXN0VGVtcGxhdGU/OiBUZW1wbGF0ZVJlZjxUeXBlYWhlYWRPcHRpb25MaXN0Q29udGV4dD47XG4gIC8qKiBzcGVjaWZpZXMgaWYgdHlwZWFoZWFkIGlzIHNjcm9sbGFibGUgICovXG4gIEBJbnB1dCgpIHR5cGVhaGVhZFNjcm9sbGFibGUgPSBmYWxzZTtcbiAgLyoqIHNwZWNpZmllcyBudW1iZXIgb2Ygb3B0aW9ucyB0byBzaG93IGluIHNjcm9sbCB2aWV3ICAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRPcHRpb25zSW5TY3JvbGxhYmxlVmlldyA9IDU7XG4gIC8qKiB1c2VkIHRvIGhpZGUgcmVzdWx0IG9uIGJsdXIgKi9cbiAgQElucHV0KCkgdHlwZWFoZWFkSGlkZVJlc3VsdHNPbkJsdXI/OiBib29sZWFuO1xuICAvKiogZmlyZWQgd2hlbiBhbiBvcHRpb25zIGxpc3Qgd2FzIG9wZW5lZCBhbmQgdGhlIHVzZXIgY2xpY2tlZCBUYWJcbiAgICogSWYgYSB2YWx1ZSBlcXVhbCB0cnVlLCBpdCB3aWxsIGJlIGNob3NlbiBmaXJzdCBvciBhY3RpdmUgaXRlbSBpbiB0aGUgbGlzdFxuICAgKiBJZiB2YWx1ZSBlcXVhbCBmYWxzZSwgaXQgd2lsbCBiZSBjaG9zZW4gYW4gYWN0aXZlIGl0ZW0gaW4gdGhlIGxpc3Qgb3Igbm90aGluZ1xuICAgKi9cbiAgQElucHV0KCkgdHlwZWFoZWFkU2VsZWN0Rmlyc3RJdGVtID0gdHJ1ZTtcbiAgLyoqIG1ha2VzIGFjdGl2ZSBmaXJzdCBpdGVtIGluIGEgbGlzdCAqL1xuICBASW5wdXQoKSB0eXBlYWhlYWRJc0ZpcnN0SXRlbUFjdGl2ZSA9IHRydWU7XG4gIC8qKiBmaXJlZCB3aGVuICdidXN5JyBzdGF0ZSBvZiB0aGlzIGNvbXBvbmVudCB3YXMgY2hhbmdlZCxcbiAgICogZmlyZWQgb24gYXN5bmMgbW9kZSBvbmx5LCByZXR1cm5zIGJvb2xlYW5cbiAgICovXG4gIEBPdXRwdXQoKSB0eXBlYWhlYWRMb2FkaW5nID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xuICAvKiogZmlyZWQgb24gZXZlcnkga2V5IGV2ZW50IGFuZCByZXR1cm5zIHRydWVcbiAgICogaW4gY2FzZSBvZiBtYXRjaGVzIGFyZSBub3QgZGV0ZWN0ZWRcbiAgICovXG4gIEBPdXRwdXQoKSB0eXBlYWhlYWROb1Jlc3VsdHMgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG4gIC8qKiBmaXJlZCB3aGVuIG9wdGlvbiB3YXMgc2VsZWN0ZWQsIHJldHVybiBvYmplY3Qgd2l0aCBkYXRhIG9mIHRoaXMgb3B0aW9uLiAqL1xuICBAT3V0cHV0KCkgdHlwZWFoZWFkT25TZWxlY3QgPSBuZXcgRXZlbnRFbWl0dGVyPFR5cGVhaGVhZE1hdGNoPigpO1xuICAvKiogZmlyZWQgd2hlbiBvcHRpb24gd2FzIHByZXZpZXdlZCwgcmV0dXJuIG9iamVjdCB3aXRoIGRhdGEgb2YgdGhpcyBvcHRpb24uICovXG4gIEBPdXRwdXQoKSB0eXBlYWhlYWRPblByZXZpZXcgPSBuZXcgRXZlbnRFbWl0dGVyPFR5cGVhaGVhZE1hdGNoPigpO1xuICAvKiogZmlyZWQgd2hlbiBibHVyIGV2ZW50IG9jY3Vycy4gcmV0dXJucyB0aGUgYWN0aXZlIGl0ZW0gKi9cbiAgQE91dHB1dCgpIHR5cGVhaGVhZE9uQmx1ciA9IG5ldyBFdmVudEVtaXR0ZXI8VHlwZWFoZWFkTWF0Y2ggfCB1bmRlZmluZWQ+KCk7XG5cbiAgLyoqXG4gICAqIEEgc2VsZWN0b3Igc3BlY2lmeWluZyB0aGUgZWxlbWVudCB0aGUgdHlwZWFoZWFkIHNob3VsZCBiZSBhcHBlbmRlZCB0by5cbiAgICovXG4gIEBJbnB1dCgpIGNvbnRhaW5lcj86IHN0cmluZztcblxuICAvKiogVGhpcyBhdHRyaWJ1dGUgaW5kaWNhdGVzIHRoYXQgdGhlIGRyb3Bkb3duIHNob3VsZCBiZSBvcGVuZWQgdXB3YXJkcyAqL1xuICBASW5wdXQoKSBkcm9wdXAgPSBmYWxzZTtcblxuICAvLyBub3QgeWV0IGltcGxlbWVudGVkXG4gIC8qKiBpZiBmYWxzZSByZXN0cmljdCBtb2RlbCB2YWx1ZXMgdG8gdGhlIG9uZXMgc2VsZWN0ZWQgZnJvbSB0aGUgcG9wdXAgb25seSB3aWxsIGJlIHByb3ZpZGVkICovXG4gIC8vIEBJbnB1dCgpIHByb3RlY3RlZCB0eXBlYWhlYWRFZGl0YWJsZTpib29sZWFuO1xuICAvKiogaWYgZmFsc2UgdGhlIGZpcnN0IG1hdGNoIGF1dG9tYXRpY2FsbHkgd2lsbCBub3QgYmUgZm9jdXNlZCBhcyB5b3UgdHlwZSAqL1xuICAvLyBASW5wdXQoKSBwcm90ZWN0ZWQgdHlwZWFoZWFkRm9jdXNGaXJzdDpib29sZWFuO1xuICAvKiogZm9ybWF0IHRoZSBuZy1tb2RlbCByZXN1bHQgYWZ0ZXIgc2VsZWN0aW9uICovXG4gIC8vIEBJbnB1dCgpIHByb3RlY3RlZCB0eXBlYWhlYWRJbnB1dEZvcm1hdHRlcjphbnk7XG4gIC8qKiBpZiB0cnVlIGF1dG9tYXRpY2FsbHkgc2VsZWN0IGFuIGl0ZW0gd2hlbiB0aGVyZSBpcyBvbmUgb3B0aW9uIHRoYXQgZXhhY3RseSBtYXRjaGVzIHRoZSB1c2VyIGlucHV0ICovXG4gIC8vIEBJbnB1dCgpIHByb3RlY3RlZCB0eXBlYWhlYWRTZWxlY3RPbkV4YWN0OmJvb2xlYW47XG4gIC8qKiAgaWYgdHJ1ZSBzZWxlY3QgdGhlIGN1cnJlbnRseSBoaWdobGlnaHRlZCBtYXRjaCBvbiBibHVyICovXG4gIC8vIEBJbnB1dCgpIHByb3RlY3RlZCB0eXBlYWhlYWRTZWxlY3RPbkJsdXI6Ym9vbGVhbjtcbiAgLyoqICBpZiBmYWxzZSBkb24ndCBmb2N1cyB0aGUgaW5wdXQgZWxlbWVudCB0aGUgdHlwZWFoZWFkIGRpcmVjdGl2ZSBpcyBhc3NvY2lhdGVkIHdpdGggb24gc2VsZWN0aW9uICovXG4gIC8vIEBJbnB1dCgpIHByb3RlY3RlZCB0eXBlYWhlYWRGb2N1c09uU2VsZWN0OmJvb2xlYW47XG5cbiAgYWN0aXZlRGVzY2VuZGFudD86IHN0cmluZztcbiAgaXNPcGVuID0gZmFsc2U7XG4gIGxpc3QgPSAnbGlzdCc7XG4gIF9jb250YWluZXI/OiBUeXBlYWhlYWRDb250YWluZXJDb21wb25lbnQ7XG4gIGlzQWN0aXZlSXRlbUNoYW5nZWQgPSBmYWxzZTtcbiAgaXNGb2N1c2VkID0gZmFsc2U7XG4gIGNhbmNlbFJlcXVlc3RPbkZvY3VzTG9zdCA9IGZhbHNlO1xuICBzZWxlY3RJdGVtT25CbHVyID0gZmFsc2U7XG4gIHByb3RlY3RlZCBrZXlVcEV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXI8c3RyaW5nPigpO1xuICBwcm90ZWN0ZWQgcGxhY2VtZW50ID0gJ2JvdHRvbSBsZWZ0JztcbiAgcHJvdGVjdGVkIF9tYXRjaGVzOiBUeXBlYWhlYWRNYXRjaFtdID0gW107XG5cbiAgcHJpdmF0ZSBfdHlwZWFoZWFkOiBDb21wb25lbnRMb2FkZXI8VHlwZWFoZWFkQ29udGFpbmVyQ29tcG9uZW50PjtcbiAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfYWxsRW50ZXJlZFZhbHVlPzogc3RyaW5nO1xuICBwcml2YXRlIF9vdXRzaWRlQ2xpY2tMaXN0ZW5lcjogKCkgPT4gdm9pZCA9ICgpID0+IHZvaWQgMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBjaXM6IENvbXBvbmVudExvYWRlckZhY3RvcnksXG4gICAgY29uZmlnOiBUeXBlYWhlYWRDb25maWcsXG4gICAgcHJpdmF0ZSBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgZWxlbWVudDogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIG5nQ29udHJvbDogTmdDb250cm9sLFxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmXG4gICkge1xuICAgIHRoaXMuX3R5cGVhaGVhZCA9IGNpc1xuICAgICAgLmNyZWF0ZUxvYWRlcjxUeXBlYWhlYWRDb250YWluZXJDb21wb25lbnQ+KGVsZW1lbnQsIHZpZXdDb250YWluZXJSZWYsIHJlbmRlcmVyKVxuICAgICAgLnByb3ZpZGUoeyBwcm92aWRlOiBUeXBlYWhlYWRDb25maWcsIHVzZVZhbHVlOiBjb25maWcgfSk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcbiAgICAgIHR5cGVhaGVhZEhpZGVSZXN1bHRzT25CbHVyOiBjb25maWcuaGlkZVJlc3VsdHNPbkJsdXIsXG4gICAgICBjYW5jZWxSZXF1ZXN0T25Gb2N1c0xvc3Q6IGNvbmZpZy5jYW5jZWxSZXF1ZXN0T25Gb2N1c0xvc3QsXG4gICAgICB0eXBlYWhlYWRTZWxlY3RGaXJzdEl0ZW06IGNvbmZpZy5zZWxlY3RGaXJzdEl0ZW0sXG4gICAgICB0eXBlYWhlYWRJc0ZpcnN0SXRlbUFjdGl2ZTogY29uZmlnLmlzRmlyc3RJdGVtQWN0aXZlLFxuICAgICAgdHlwZWFoZWFkTWluTGVuZ3RoOiBjb25maWcubWluTGVuZ3RoLFxuICAgICAgYWRhcHRpdmVQb3NpdGlvbjogY29uZmlnLmFkYXB0aXZlUG9zaXRpb24sXG4gICAgICBpc0FuaW1hdGVkOiBjb25maWcuaXNBbmltYXRlZCxcbiAgICAgIHNlbGVjdEl0ZW1PbkJsdXI6IGNvbmZpZy5zZWxlY3RJdGVtT25CbHVyXG4gICAgfSk7XG4gIH1cblxuICBnZXQgbWF0Y2hlcygpOiBUeXBlYWhlYWRNYXRjaFtdIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0Y2hlcztcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMudHlwZWFoZWFkT3B0aW9uc0xpbWl0ID0gdGhpcy50eXBlYWhlYWRPcHRpb25zTGltaXQgfHwgMjA7XG5cbiAgICB0aGlzLnR5cGVhaGVhZE1pbkxlbmd0aCA9IHRoaXMudHlwZWFoZWFkTWluTGVuZ3RoID09PSB2b2lkIDAgPyAxIDogdGhpcy50eXBlYWhlYWRNaW5MZW5ndGg7XG5cbiAgICAvLyBhc3luYyBzaG91bGQgYmUgZmFsc2UgaW4gY2FzZSBvZiBhcnJheVxuICAgIGlmICh0aGlzLnR5cGVhaGVhZEFzeW5jID09PSB1bmRlZmluZWQgJiYgIWlzT2JzZXJ2YWJsZSh0aGlzLnR5cGVhaGVhZCkpIHtcbiAgICAgIHRoaXMudHlwZWFoZWFkQXN5bmMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoaXNPYnNlcnZhYmxlKHRoaXMudHlwZWFoZWFkKSkge1xuICAgICAgdGhpcy50eXBlYWhlYWRBc3luYyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudHlwZWFoZWFkQXN5bmMpIHtcbiAgICAgIHRoaXMuYXN5bmNBY3Rpb25zKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3luY0FjdGlvbnMoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoZWNrRGVsaW1pdGVyc0NvbmZsaWN0KCk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdpbnB1dCcsIFsnJGV2ZW50J10pXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIG9uSW5wdXQoZTogYW55KTogdm9pZCB7XG4gICAgLy8gRm9yIGA8aW5wdXQ+YHMsIHVzZSB0aGUgYHZhbHVlYCBwcm9wZXJ0eS4gRm9yIG90aGVycyB0aGF0IGRvbid0IGhhdmUgYVxuICAgIC8vIGB2YWx1ZWAgKHN1Y2ggYXMgYDxzcGFuIGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIj5gKSwgdXNlIGVpdGhlclxuICAgIC8vIGB0ZXh0Q29udGVudGAgb3IgYGlubmVyVGV4dGAgKGRlcGVuZGluZyBvbiB3aGljaCBvbmUgaXMgc3VwcG9ydGVkLCBpLmUuXG4gICAgLy8gRmlyZWZveCBvciBJRSkuXG4gICAgY29uc3QgdmFsdWUgPVxuICAgICAgZS50YXJnZXQudmFsdWUgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IGUudGFyZ2V0LnZhbHVlXG4gICAgICAgIDogZS50YXJnZXQudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IGUudGFyZ2V0LnRleHRDb250ZW50XG4gICAgICAgIDogZS50YXJnZXQuaW5uZXJUZXh0O1xuXG4gICAgaWYgKHZhbHVlICE9IG51bGwgJiYgdmFsdWUudHJpbSgpLmxlbmd0aCA+PSB0aGlzLnR5cGVhaGVhZE1pbkxlbmd0aCkge1xuICAgICAgdGhpcy50eXBlYWhlYWRMb2FkaW5nLmVtaXQodHJ1ZSk7XG4gICAgICB0aGlzLmtleVVwRXZlbnRFbWl0dGVyLmVtaXQoZS50YXJnZXQudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnR5cGVhaGVhZExvYWRpbmcuZW1pdChmYWxzZSk7XG4gICAgICB0aGlzLnR5cGVhaGVhZE5vUmVzdWx0cy5lbWl0KGZhbHNlKTtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2tleXVwJywgWyckZXZlbnQnXSlcbiAgb25DaGFuZ2UoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fY29udGFpbmVyKSB7XG4gICAgICAvLyBlc2NcbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAyNyB8fCBldmVudC5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gdXBcbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzOCB8fCBldmVudC5rZXkgPT09ICdBcnJvd1VwJykge1xuICAgICAgICB0aGlzLmlzQWN0aXZlSXRlbUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9jb250YWluZXIucHJldkFjdGl2ZU1hdGNoKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBkb3duXG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNDAgfHwgZXZlbnQua2V5ID09PSAnQXJyb3dEb3duJykge1xuICAgICAgICB0aGlzLmlzQWN0aXZlSXRlbUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9jb250YWluZXIubmV4dEFjdGl2ZU1hdGNoKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBlbnRlclxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzIHx8IGV2ZW50LmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICB0aGlzLl9jb250YWluZXIuc2VsZWN0QWN0aXZlTWF0Y2goKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignY2xpY2snKVxuICBASG9zdExpc3RlbmVyKCdmb2N1cycpXG4gIG9uRm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5pc0ZvY3VzZWQgPSB0cnVlO1xuICAgIC8vIGFkZCBzZXRUaW1lb3V0IHRvIGZpeCBpc3N1ZSAjNTI1MVxuICAgIC8vIHRvIGdldCBhbmQgZW1pdCB1cGRhdGVkIHZhbHVlIGlmIGl0J3MgY2hhbmdlZCBvbiBmb2N1c1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudHlwZWFoZWFkTWluTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMudHlwZWFoZWFkTG9hZGluZy5lbWl0KHRydWUpO1xuICAgICAgICB0aGlzLmtleVVwRXZlbnRFbWl0dGVyLmVtaXQodGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQudmFsdWUgfHwgJycpO1xuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignYmx1cicpXG4gIG9uQmx1cigpOiB2b2lkIHtcbiAgICB0aGlzLmlzRm9jdXNlZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLl9jb250YWluZXIgJiYgIXRoaXMuX2NvbnRhaW5lci5pc0ZvY3VzZWQpIHtcbiAgICAgIHRoaXMudHlwZWFoZWFkT25CbHVyLmVtaXQodGhpcy5fY29udGFpbmVyLmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lciAmJiB0aGlzLl9tYXRjaGVzPy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMudHlwZWFoZWFkT25CbHVyLmVtaXQoXG4gICAgICAgIG5ldyBUeXBlYWhlYWRNYXRjaCh0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC52YWx1ZSwgdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQudmFsdWUsIGZhbHNlKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdrZXlkb3duJywgWyckZXZlbnQnXSlcbiAgb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgLy8gbm8gY29udGFpbmVyIC0gbm8gcHJvYmxlbXNcbiAgICBpZiAoIXRoaXMuX2NvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5rZXlDb2RlID09PSA5IHx8IGV2ZW50LmtleSA9PT0gJ1RhYicpIHtcbiAgICAgIHRoaXMub25CbHVyKCk7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDkgfHwgZXZlbnQua2V5ID09PSAnVGFiJyB8fCBldmVudC5rZXlDb2RlID09PSAxMyB8fCBldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAodGhpcy50eXBlYWhlYWRTZWxlY3RGaXJzdEl0ZW0pIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnNlbGVjdEFjdGl2ZU1hdGNoKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMudHlwZWFoZWFkU2VsZWN0Rmlyc3RJdGVtKSB7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5zZWxlY3RBY3RpdmVNYXRjaCh0aGlzLmlzQWN0aXZlSXRlbUNoYW5nZWQpO1xuICAgICAgICB0aGlzLmlzQWN0aXZlSXRlbUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2hhbmdlTW9kZWwobWF0Y2g/OiBUeXBlYWhlYWRNYXRjaCk6IHZvaWQge1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHZhbHVlU3RyOiBzdHJpbmc7XG4gICAgaWYgKHRoaXMudHlwZWFoZWFkTXVsdGlwbGVTZWFyY2ggJiYgdGhpcy5fYWxsRW50ZXJlZFZhbHVlKSB7XG4gICAgICBjb25zdCB0b2tlbnMgPSB0aGlzLl9hbGxFbnRlcmVkVmFsdWUuc3BsaXQobmV3IFJlZ0V4cChgKFske3RoaXMudHlwZWFoZWFkTXVsdGlwbGVTZWFyY2hEZWxpbWl0ZXJzfV0rKWApKTtcbiAgICAgIHRoaXMuX2FsbEVudGVyZWRWYWx1ZSA9IHRva2Vuc1xuICAgICAgICAuc2xpY2UoMCwgdG9rZW5zLmxlbmd0aCAtIDEpXG4gICAgICAgIC5jb25jYXQobWF0Y2gudmFsdWUpXG4gICAgICAgIC5qb2luKCcnKTtcbiAgICAgIHZhbHVlU3RyID0gdGhpcy5fYWxsRW50ZXJlZFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZVN0ciA9IG1hdGNoLnZhbHVlO1xuICAgIH1cbiAgICB0aGlzLm5nQ29udHJvbC52aWV3VG9Nb2RlbFVwZGF0ZSh2YWx1ZVN0cik7XG4gICAgdGhpcy5uZ0NvbnRyb2wuY29udHJvbD8uc2V0VmFsdWUodmFsdWVTdHIpO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0aW9uLm1hcmtGb3JDaGVjaygpO1xuICAgIHRoaXMuaGlkZSgpO1xuICB9XG5cbiAgc2hvdygpOiB2b2lkIHtcbiAgICB0aGlzLl90eXBlYWhlYWRcbiAgICAgIC5hdHRhY2goVHlwZWFoZWFkQ29udGFpbmVyQ29tcG9uZW50KVxuICAgICAgLnRvKHRoaXMuY29udGFpbmVyKVxuICAgICAgLnBvc2l0aW9uKHsgYXR0YWNobWVudDogYCR7dGhpcy5kcm9wdXAgPyAndG9wJyA6ICdib3R0b20nfSBsZWZ0YCB9KVxuICAgICAgLnNob3coe1xuICAgICAgICB0eXBlYWhlYWRSZWY6IHRoaXMsXG4gICAgICAgIHBsYWNlbWVudDogdGhpcy5wbGFjZW1lbnQsXG4gICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgIGRyb3B1cDogdGhpcy5kcm9wdXBcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrTGlzdGVuZXIgPSB0aGlzLnJlbmRlcmVyLmxpc3RlbignZG9jdW1lbnQnLCAnY2xpY2snLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLnR5cGVhaGVhZE1pbkxlbmd0aCA9PT0gMCAmJiB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5jb250YWlucyhldmVudC50YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy50eXBlYWhlYWRIaWRlUmVzdWx0c09uQmx1ciB8fCB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5jb250YWlucyhldmVudC50YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMub25PdXRzaWRlQ2xpY2soKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5fdHlwZWFoZWFkLmluc3RhbmNlIHx8ICF0aGlzLm5nQ29udHJvbC5jb250cm9sKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY29udGFpbmVyID0gdGhpcy5fdHlwZWFoZWFkLmluc3RhbmNlO1xuICAgIHRoaXMuX2NvbnRhaW5lci5wYXJlbnQgPSB0aGlzO1xuICAgIC8vIFRoaXMgaW1wcm92ZXMgdGhlIHNwZWVkIGFzIGl0IHdvbid0IGhhdmUgdG8gYmUgZG9uZSBmb3IgZWFjaCBsaXN0IGl0ZW1cblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRRdWVyeSA9IChcbiAgICAgIHRoaXMudHlwZWFoZWFkTGF0aW5pemUgPyBsYXRpbml6ZSh0aGlzLm5nQ29udHJvbC5jb250cm9sLnZhbHVlKSA6IHRoaXMubmdDb250cm9sLmNvbnRyb2wudmFsdWVcbiAgICApXG4gICAgICAudG9TdHJpbmcoKVxuICAgICAgLnRvTG93ZXJDYXNlKCk7XG5cbiAgICB0aGlzLl9jb250YWluZXIucXVlcnkgPSB0aGlzLnRva2VuaXplUXVlcnkobm9ybWFsaXplZFF1ZXJ5KTtcblxuICAgIHRoaXMuX2NvbnRhaW5lci5tYXRjaGVzID0gdGhpcy5fbWF0Y2hlcztcbiAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5mb2N1cygpO1xuXG4gICAgdGhpcy5fY29udGFpbmVyLmFjdGl2ZUNoYW5nZUV2ZW50LnN1YnNjcmliZSgoYWN0aXZlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5hY3RpdmVEZXNjZW5kYW50ID0gYWN0aXZlSWQ7XG4gICAgICB0aGlzLmNoYW5nZURldGVjdGlvbi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gIH1cblxuICBoaWRlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl90eXBlYWhlYWQuaXNTaG93bikge1xuICAgICAgdGhpcy5fdHlwZWFoZWFkLmhpZGUoKTtcbiAgICAgIHRoaXMuX291dHNpZGVDbGlja0xpc3RlbmVyKCk7XG4gICAgICB0aGlzLl9jb250YWluZXIgPSB2b2lkIDA7XG4gICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5jaGFuZ2VEZXRlY3Rpb24ubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICAgIHRoaXMudHlwZWFoZWFkT25QcmV2aWV3LmVtaXQoKTtcbiAgfVxuXG4gIG9uT3V0c2lkZUNsaWNrKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9jb250YWluZXIgJiYgIXRoaXMuX2NvbnRhaW5lci5pc0ZvY3VzZWQpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIGNsZWFuIHVwIHN1YnNjcmlwdGlvbnNcbiAgICBmb3IgKGNvbnN0IHN1YiBvZiB0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gICAgdGhpcy5fdHlwZWFoZWFkLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luY0FjdGlvbnMoKTogdm9pZCB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFxuICAgICAgdGhpcy5rZXlVcEV2ZW50RW1pdHRlclxuICAgICAgICAucGlwZShcbiAgICAgICAgICBkZWJvdW5jZVRpbWU8c3RyaW5nPih0aGlzLnR5cGVhaGVhZFdhaXRNcyksXG4gICAgICAgICAgdGFwKCh2YWx1ZSkgPT4gKHRoaXMuX2FsbEVudGVyZWRWYWx1ZSA9IHZhbHVlKSksXG4gICAgICAgICAgc3dpdGNoTWFwKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy50eXBlYWhlYWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHlwZWFoZWFkO1xuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgobWF0Y2hlcykgPT4ge1xuICAgICAgICAgIHRoaXMuZmluYWxpemVBc3luY0NhbGwobWF0Y2hlcyk7XG4gICAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzeW5jQWN0aW9ucygpOiB2b2lkIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goXG4gICAgICB0aGlzLmtleVVwRXZlbnRFbWl0dGVyXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIGRlYm91bmNlVGltZTxzdHJpbmc+KHRoaXMudHlwZWFoZWFkV2FpdE1zKSxcbiAgICAgICAgICBtZXJnZU1hcCgodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWxsRW50ZXJlZFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkUXVlcnkgPSB0aGlzLm5vcm1hbGl6ZVF1ZXJ5KHZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLnR5cGVhaGVhZCkge1xuICAgICAgICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHR5cGVhaGVhZCA9IGlzT2JzZXJ2YWJsZSh0aGlzLnR5cGVhaGVhZCkgPyB0aGlzLnR5cGVhaGVhZCA6IGZyb20odGhpcy50eXBlYWhlYWQpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHlwZWFoZWFkLnBpcGUoXG4gICAgICAgICAgICAgIGZpbHRlcigob3B0aW9uOiBUeXBlYWhlYWRPcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFvcHRpb24gJiYgdGhpcy50ZXN0TWF0Y2godGhpcy5ub3JtYWxpemVPcHRpb24ob3B0aW9uKSwgbm9ybWFsaXplZFF1ZXJ5KTtcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIHRvQXJyYXkoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUoKG1hdGNoZXM6IFR5cGVhaGVhZE9wdGlvbltdKSA9PiB7XG4gICAgICAgICAgdGhpcy5maW5hbGl6ZUFzeW5jQ2FsbChtYXRjaGVzKTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIG5vcm1hbGl6ZU9wdGlvbihvcHRpb246IFR5cGVhaGVhZE9wdGlvbik6IHN0cmluZyB7XG4gICAgY29uc3Qgb3B0aW9uVmFsdWU6IHN0cmluZyA9IGdldFZhbHVlRnJvbU9iamVjdChvcHRpb24sIHRoaXMudHlwZWFoZWFkT3B0aW9uRmllbGQpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRPcHRpb24gPSB0aGlzLnR5cGVhaGVhZExhdGluaXplID8gbGF0aW5pemUob3B0aW9uVmFsdWUpIDogb3B0aW9uVmFsdWU7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZE9wdGlvbi50b0xvd2VyQ2FzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHRva2VuaXplUXVlcnkoY3VycmVudFF1ZXJ5OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHN0cmluZyB8IHN0cmluZ1tdIHtcbiAgICBsZXQgcXVlcnkgPSBjdXJyZW50UXVlcnk7XG4gICAgaWYgKHRoaXMudHlwZWFoZWFkTXVsdGlwbGVTZWFyY2ggJiYgdGhpcy50eXBlYWhlYWRTaW5nbGVXb3Jkcykge1xuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5oYXZlQ29tbW9uQ2hhcmFjdGVycyhcbiAgICAgICAgICBgJHt0aGlzLnR5cGVhaGVhZFBocmFzZURlbGltaXRlcnN9JHt0aGlzLnR5cGVhaGVhZFdvcmREZWxpbWl0ZXJzfWAsXG4gICAgICAgICAgdGhpcy50eXBlYWhlYWRNdWx0aXBsZVNlYXJjaERlbGltaXRlcnNcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIC8vIHNpbmdsZSB3b3JkcyBhbmQgbXVsdGlwbGUgc2VhcmNoIGRlbGltaXRlcnMgYXJlIGRpZmZlcmVudCwgY2FuIGJlIHVzZWQgdG9nZXRoZXJcbiAgICAgICAgcXVlcnkgPSB0b2tlbml6ZShcbiAgICAgICAgICBxdWVyeSBhcyBzdHJpbmcsXG4gICAgICAgICAgdGhpcy50eXBlYWhlYWRXb3JkRGVsaW1pdGVycyxcbiAgICAgICAgICB0aGlzLnR5cGVhaGVhZFBocmFzZURlbGltaXRlcnMsXG4gICAgICAgICAgdGhpcy50eXBlYWhlYWRNdWx0aXBsZVNlYXJjaERlbGltaXRlcnNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZWFoZWFkU2luZ2xlV29yZHMpIHtcbiAgICAgIHF1ZXJ5ID0gdG9rZW5pemUocXVlcnkgYXMgc3RyaW5nLCB0aGlzLnR5cGVhaGVhZFdvcmREZWxpbWl0ZXJzLCB0aGlzLnR5cGVhaGVhZFBocmFzZURlbGltaXRlcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtdWx0aXBsZSBzZWFyY2hlc1xuICAgICAgcXVlcnkgPSB0b2tlbml6ZShxdWVyeSBhcyBzdHJpbmcsIHZvaWQgMCwgdm9pZCAwLCB0aGlzLnR5cGVhaGVhZE11bHRpcGxlU2VhcmNoRGVsaW1pdGVycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG5cbiAgcHJvdGVjdGVkIG5vcm1hbGl6ZVF1ZXJ5KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCBzdHJpbmdbXSB7XG4gICAgLy8gSWYgc2luZ2xlV29yZHMsIGJyZWFrIG1vZGVsIGhlcmUgdG8gbm90IGJlIGRvaW5nIGV4dHJhIHdvcmsgb24gZWFjaCBpdGVyYXRpb25cbiAgICBsZXQgbm9ybWFsaXplZFF1ZXJ5OiBzdHJpbmcgfCBzdHJpbmdbXSA9ICh0aGlzLnR5cGVhaGVhZExhdGluaXplID8gbGF0aW5pemUodmFsdWUpIDogdmFsdWUpXG4gICAgICAudG9TdHJpbmcoKVxuICAgICAgLnRvTG93ZXJDYXNlKCk7XG5cbiAgICBub3JtYWxpemVkUXVlcnkgPSB0aGlzLnRva2VuaXplUXVlcnkobm9ybWFsaXplZFF1ZXJ5KTtcblxuICAgIHJldHVybiBub3JtYWxpemVkUXVlcnk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdGVzdE1hdGNoKG1hdGNoOiBzdHJpbmcsIHRlc3Q6IHN0cmluZ1tdIHwgc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgbGV0IHNwYWNlTGVuZ3RoOiBudW1iZXI7XG5cbiAgICBpZiAodHlwZW9mIHRlc3QgPT09ICdvYmplY3QnKSB7XG4gICAgICBzcGFjZUxlbmd0aCA9IHRlc3QubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGFjZUxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICh0ZXN0W2ldLmxlbmd0aCA+IDAgJiYgbWF0Y2guaW5kZXhPZih0ZXN0W2ldKSA8IDApIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoLmluZGV4T2YodGVzdCkgPj0gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBmaW5hbGl6ZUFzeW5jQ2FsbChtYXRjaGVzPzogVHlwZWFoZWFkT3B0aW9uIHwgVHlwZWFoZWFkT3B0aW9uW10pOiB2b2lkIHtcbiAgICB0aGlzLnByZXBhcmVNYXRjaGVzKG1hdGNoZXMgfHwgW10pO1xuXG4gICAgdGhpcy50eXBlYWhlYWRMb2FkaW5nLmVtaXQoZmFsc2UpO1xuICAgIHRoaXMudHlwZWFoZWFkTm9SZXN1bHRzLmVtaXQoIXRoaXMuaGFzTWF0Y2hlcygpKTtcblxuICAgIGlmICghdGhpcy5oYXNNYXRjaGVzKCkpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmlzRm9jdXNlZCAmJiB0aGlzLmNhbmNlbFJlcXVlc3RPbkZvY3VzTG9zdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jb250YWluZXIgJiYgdGhpcy5uZ0NvbnRyb2wuY29udHJvbCkge1xuICAgICAgLy8gZml4OiByZW1vdmUgdXNhZ2Ugb2YgbmdDb250cm9sIGludGVybmFsc1xuICAgICAgY29uc3QgX2NvbnRyb2xWYWx1ZSA9XG4gICAgICAgICh0aGlzLnR5cGVhaGVhZExhdGluaXplID8gbGF0aW5pemUodGhpcy5uZ0NvbnRyb2wuY29udHJvbC52YWx1ZSkgOiB0aGlzLm5nQ29udHJvbC5jb250cm9sLnZhbHVlKSB8fCAnJztcblxuICAgICAgLy8gVGhpcyBpbXByb3ZlcyB0aGUgc3BlZWQgYXMgaXQgd29uJ3QgaGF2ZSB0byBiZSBkb25lIGZvciBlYWNoIGxpc3QgaXRlbVxuICAgICAgY29uc3Qgbm9ybWFsaXplZFF1ZXJ5ID0gX2NvbnRyb2xWYWx1ZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIHRoaXMuX2NvbnRhaW5lci5xdWVyeSA9IHRoaXMudG9rZW5pemVRdWVyeShub3JtYWxpemVkUXVlcnkpO1xuICAgICAgdGhpcy5fY29udGFpbmVyLm1hdGNoZXMgPSB0aGlzLl9tYXRjaGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgcHJlcGFyZU1hdGNoZXMob3B0aW9uczogVHlwZWFoZWFkT3B0aW9uIHwgVHlwZWFoZWFkT3B0aW9uW10pOiB2b2lkIHtcbiAgICBjb25zdCBsaW1pdGVkID0gb3B0aW9ucy5zbGljZSgwLCB0aGlzLnR5cGVhaGVhZE9wdGlvbnNMaW1pdCk7XG4gICAgY29uc3Qgc29ydGVkID0gIXRoaXMudHlwZWFoZWFkT3JkZXJCeSA/IGxpbWl0ZWQgOiB0aGlzLm9yZGVyTWF0Y2hlcyhsaW1pdGVkKTtcblxuICAgIGlmICh0aGlzLnR5cGVhaGVhZEdyb3VwRmllbGQpIHtcbiAgICAgIGxldCBtYXRjaGVzOiBUeXBlYWhlYWRNYXRjaFtdID0gW107XG5cbiAgICAgIC8vIGV4dHJhY3QgYWxsIGdyb3VwIG5hbWVzXG4gICAgICBjb25zdCBncm91cHMgPSBzb3J0ZWRcbiAgICAgICAgLm1hcCgob3B0aW9uOiBUeXBlYWhlYWRPcHRpb24pID0+IGdldFZhbHVlRnJvbU9iamVjdChvcHRpb24sIHRoaXMudHlwZWFoZWFkR3JvdXBGaWVsZCkpXG4gICAgICAgIC5maWx0ZXIoKHY6IHN0cmluZywgaTogbnVtYmVyLCBhOiBzdHJpbmdbXSkgPT4gYS5pbmRleE9mKHYpID09PSBpKTtcblxuICAgICAgZ3JvdXBzLmZvckVhY2goKGdyb3VwOiBzdHJpbmcpID0+IHtcbiAgICAgICAgLy8gYWRkIGdyb3VwIGhlYWRlciB0byBhcnJheSBvZiBtYXRjaGVzXG4gICAgICAgIG1hdGNoZXMucHVzaChuZXcgVHlwZWFoZWFkTWF0Y2goZ3JvdXAsIGdyb3VwLCB0cnVlKSk7XG5cbiAgICAgICAgLy8gYWRkIGVhY2ggaXRlbSBvZiBncm91cCB0byBhcnJheSBvZiBtYXRjaGVzXG4gICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLmNvbmNhdChcbiAgICAgICAgICBzb3J0ZWRcbiAgICAgICAgICAgIC5maWx0ZXIoKG9wdGlvbjogVHlwZWFoZWFkT3B0aW9uKSA9PiBnZXRWYWx1ZUZyb21PYmplY3Qob3B0aW9uLCB0aGlzLnR5cGVhaGVhZEdyb3VwRmllbGQpID09PSBncm91cClcbiAgICAgICAgICAgIC5tYXAoXG4gICAgICAgICAgICAgIChvcHRpb246IFR5cGVhaGVhZE9wdGlvbikgPT5cbiAgICAgICAgICAgICAgICBuZXcgVHlwZWFoZWFkTWF0Y2gob3B0aW9uLCBnZXRWYWx1ZUZyb21PYmplY3Qob3B0aW9uLCB0aGlzLnR5cGVhaGVhZE9wdGlvbkZpZWxkKSlcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9tYXRjaGVzID0gbWF0Y2hlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbWF0Y2hlcyA9IHNvcnRlZC5tYXAoXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgIChvcHRpb246IGFueSkgPT4gbmV3IFR5cGVhaGVhZE1hdGNoKG9wdGlvbiwgZ2V0VmFsdWVGcm9tT2JqZWN0KG9wdGlvbiwgdGhpcy50eXBlYWhlYWRPcHRpb25GaWVsZCkpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBvcmRlck1hdGNoZXMob3B0aW9uczogVHlwZWFoZWFkT3B0aW9uW10pOiBUeXBlYWhlYWRPcHRpb25bXSB7XG4gICAgaWYgKCFvcHRpb25zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy50eXBlYWhlYWRPcmRlckJ5ICE9PSBudWxsICYmXG4gICAgICB0aGlzLnR5cGVhaGVhZE9yZGVyQnkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgdHlwZW9mIHRoaXMudHlwZWFoZWFkT3JkZXJCeSA9PT0gJ29iamVjdCcgJiZcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMudHlwZWFoZWFkT3JkZXJCeSkubGVuZ3RoID09PSAwXG4gICAgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGaWVsZCBhbmQgZGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIHR5cGVhaGVhZE9yZGVyQnkgaGF2ZSB0byBiZSBzZXQgYWNjb3JkaW5nIHRvIGRvY3VtZW50YXRpb24hJyk7XG5cbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIGNvbnN0IHsgZmllbGQsIGRpcmVjdGlvbiB9ID0gdGhpcy50eXBlYWhlYWRPcmRlckJ5IHx8IHt9O1xuXG4gICAgaWYgKCFkaXJlY3Rpb24gfHwgIShkaXJlY3Rpb24gPT09ICdhc2MnIHx8IGRpcmVjdGlvbiA9PT0gJ2Rlc2MnKSkge1xuICAgICAgY29uc29sZS5lcnJvcigndHlwZWFoZWFkT3JkZXJCeSBkaXJlY3Rpb24gaGFzIHRvIGVxdWFsIFwiYXNjXCIgb3IgXCJkZXNjXCIuIFBsZWFzZSBmb2xsb3cgdGhlIGRvY3VtZW50YXRpb24uJyk7XG5cbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9uc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09ICdhc2MnID8gb3B0aW9ucy5zb3J0KCkgOiBvcHRpb25zLnNvcnQoKS5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFmaWVsZCB8fCB0eXBlb2YgZmllbGQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCd0eXBlYWhlYWRPcmRlckJ5IGZpZWxkIGhhcyB0byBzZXQgYWNjb3JkaW5nIHRvIHRoZSBkb2N1bWVudGF0aW9uLicpO1xuXG4gICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucy5zb3J0KChhOiBUeXBlYWhlYWRPcHRpb24sIGI6IFR5cGVhaGVhZE9wdGlvbikgPT4ge1xuICAgICAgY29uc3Qgc3RyaW5nQSA9IGdldFZhbHVlRnJvbU9iamVjdChhLCBmaWVsZCk7XG4gICAgICBjb25zdCBzdHJpbmdCID0gZ2V0VmFsdWVGcm9tT2JqZWN0KGIsIGZpZWxkKTtcblxuICAgICAgaWYgKHN0cmluZ0EgPCBzdHJpbmdCKSB7XG4gICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09ICdhc2MnID8gLTEgOiAxO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RyaW5nQSA+IHN0cmluZ0IpIHtcbiAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gJ2FzYycgPyAxIDogLTE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGhhc01hdGNoZXMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX21hdGNoZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBjaGVja0RlbGltaXRlcnNDb25mbGljdCgpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnR5cGVhaGVhZE11bHRpcGxlU2VhcmNoICYmXG4gICAgICB0aGlzLnR5cGVhaGVhZFNpbmdsZVdvcmRzICYmXG4gICAgICB0aGlzLmhhdmVDb21tb25DaGFyYWN0ZXJzKFxuICAgICAgICBgJHt0aGlzLnR5cGVhaGVhZFBocmFzZURlbGltaXRlcnN9JHt0aGlzLnR5cGVhaGVhZFdvcmREZWxpbWl0ZXJzfWAsXG4gICAgICAgIHRoaXMudHlwZWFoZWFkTXVsdGlwbGVTZWFyY2hEZWxpbWl0ZXJzXG4gICAgICApXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERlbGltaXRlcnMgdXNlZCBpbiB0eXBlYWhlYWRNdWx0aXBsZVNlYXJjaERlbGltaXRlcnMgbXVzdCBiZSBkaWZmZXJlbnRcbiAgICAgICAgICBmcm9tIGRlbGltaXRlcnMgdXNlZCBpbiB0eXBlYWhlYWRXb3JkRGVsaW1pdGVycyAoY3VycmVudCB2YWx1ZTogJHt0aGlzLnR5cGVhaGVhZFdvcmREZWxpbWl0ZXJzfSkgYW5kXG4gICAgICAgICAgdHlwZWFoZWFkUGhyYXNlRGVsaW1pdGVycyAoY3VycmVudCB2YWx1ZTogJHt0aGlzLnR5cGVhaGVhZFBocmFzZURlbGltaXRlcnN9KS5cbiAgICAgICAgICBQbGVhc2UgcmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb25gKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgaGF2ZUNvbW1vbkNoYXJhY3RlcnMoc3RyMTogc3RyaW5nLCBzdHIyOiBzdHJpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cjEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzdHIxLmNoYXJBdChpKS5pbmRleE9mKHN0cjIpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=
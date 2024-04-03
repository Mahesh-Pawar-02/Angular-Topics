import { Component, ElementRef, EventEmitter, HostBinding, Renderer2, ViewChild } from '@angular/core';
import { take } from 'rxjs/operators';
import { getFullYear, getMonth } from 'ngx-bootstrap/chronos';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { TimepickerComponent } from 'ngx-bootstrap/timepicker';
import { BsDatepickerAbstractComponent } from '../../base/bs-datepicker-container';
import { BsDatepickerConfig } from '../../bs-datepicker.config';
import { BsDatepickerActions } from '../../reducer/bs-datepicker.actions';
import { BsDatepickerEffects } from '../../reducer/bs-datepicker.effects';
import { BsDatepickerStore } from '../../reducer/bs-datepicker.store';
import { datepickerAnimation } from '../../datepicker-animations';
import { dayInMilliseconds } from '../../reducer/_defaults';
import * as i0 from "@angular/core";
import * as i1 from "../../bs-datepicker.config";
import * as i2 from "../../reducer/bs-datepicker.store";
import * as i3 from "../../reducer/bs-datepicker.actions";
import * as i4 from "../../reducer/bs-datepicker.effects";
import * as i5 from "ngx-bootstrap/positioning";
import * as i6 from "@angular/common";
import * as i7 from "ngx-bootstrap/timepicker";
import * as i8 from "./bs-custom-dates-view.component";
import * as i9 from "./bs-days-calendar-view.component";
import * as i10 from "./bs-months-calendar-view.component";
import * as i11 from "./bs-years-calendar-view.component";
export class BsDaterangepickerContainerComponent extends BsDatepickerAbstractComponent {
    set value(value) {
        this._effects?.setRangeValue(value);
    }
    get isDatePickerDisabled() {
        return !!this._config.isDisabled;
    }
    get isDatepickerDisabled() {
        return this.isDatePickerDisabled ? '' : null;
    }
    get isDatepickerReadonly() {
        return this.isDatePickerDisabled ? '' : null;
    }
    constructor(_renderer, _config, _store, _element, _actions, _effects, _positionService) {
        super();
        this._config = _config;
        this._store = _store;
        this._element = _element;
        this._actions = _actions;
        this._positionService = _positionService;
        this.valueChange = new EventEmitter();
        this.animationState = 'void';
        this._rangeStack = [];
        this.chosenRange = [];
        this._subs = [];
        this.isRangePicker = true;
        this._effects = _effects;
        this.customRanges = this._config.ranges || [];
        this.customRangeBtnLbl = this._config.customRangeButtonLabel;
        _renderer.setStyle(_element.nativeElement, 'display', 'block');
        _renderer.setStyle(_element.nativeElement, 'position', 'absolute');
    }
    ngOnInit() {
        this._positionService.setOptions({
            modifiers: {
                flip: {
                    enabled: this._config.adaptivePosition
                },
                preventOverflow: {
                    enabled: this._config.adaptivePosition
                }
            },
            allowedPositions: this._config.allowedPositions
        });
        this._positionService.event$?.pipe(take(1)).subscribe(() => {
            this._positionService.disable();
            if (this._config.isAnimated) {
                this.animationState = this.isTopPosition ? 'animated-up' : 'animated-down';
                return;
            }
            this.animationState = 'unanimated';
        });
        this.containerClass = this._config.containerClass;
        this.isOtherMonthsActive = this._config.selectFromOtherMonth;
        this.withTimepicker = this._config.withTimepicker;
        this._effects
            ?.init(this._store)
            // intial state options
            // todo: fix this, split configs
            .setOptions(this._config)
            // data binding view --> model
            .setBindings(this)
            // set event handlers
            .setEventHandlers(this)
            .registerDatepickerSideEffects();
        let currentDate;
        // todo: move it somewhere else
        // on selected date change
        this._subs.push(this._store
            .select((state) => state.selectedRange)
            .subscribe((dateRange) => {
            currentDate = dateRange;
            this.valueChange.emit(dateRange);
            this.chosenRange = dateRange || [];
        }));
        this._subs.push(this._store
            .select((state) => state.selectedTime)
            .subscribe((time) => {
            if (!time ||
                !time[0] ||
                !time[1] ||
                !(time[0] instanceof Date) ||
                !(time[1] instanceof Date) ||
                (currentDate && time[0] === currentDate[0] && time[1] === currentDate[1])) {
                return;
            }
            this.valueChange.emit(time);
            this.chosenRange = time || [];
        }));
    }
    ngAfterViewInit() {
        this.selectedTimeSub.add(this.selectedTime?.subscribe((val) => {
            if (Array.isArray(val) && val.length >= 2) {
                this.startTimepicker?.writeValue(val[0]);
                this.endTimepicker?.writeValue(val[1]);
            }
        }));
        this.startTimepicker?.registerOnChange((val) => {
            this.timeSelectHandler(val, 0);
        });
        this.endTimepicker?.registerOnChange((val) => {
            this.timeSelectHandler(val, 1);
        });
    }
    get isTopPosition() {
        return this._element.nativeElement.classList.contains('top');
    }
    positionServiceEnable() {
        this._positionService.enable();
    }
    timeSelectHandler(date, index) {
        this._store.dispatch(this._actions.selectTime(date, index));
    }
    daySelectHandler(day) {
        if (!day) {
            return;
        }
        const isDisabled = this.isOtherMonthsActive ? day.isDisabled : day.isOtherMonth || day.isDisabled;
        if (isDisabled) {
            return;
        }
        this.rangesProcessing(day);
    }
    monthSelectHandler(day) {
        if (!day || day.isDisabled) {
            return;
        }
        day.isSelected = true;
        if (this._config.minMode !== 'month') {
            if (day.isDisabled) {
                return;
            }
            this._store.dispatch(this._actions.navigateTo({
                unit: {
                    month: getMonth(day.date),
                    year: getFullYear(day.date)
                },
                viewMode: 'day'
            }));
            return;
        }
        this.rangesProcessing(day);
    }
    yearSelectHandler(day) {
        if (!day || day.isDisabled) {
            return;
        }
        day.isSelected = true;
        if (this._config.minMode !== 'year') {
            if (day.isDisabled) {
                return;
            }
            this._store.dispatch(this._actions.navigateTo({
                unit: {
                    year: getFullYear(day.date)
                },
                viewMode: 'month'
            }));
            return;
        }
        this.rangesProcessing(day);
    }
    rangesProcessing(day) {
        // if only one date is already selected
        // and user clicks on previous date
        // start selection from new date
        // but if new date is after initial one
        // than finish selection
        if (this._rangeStack.length === 1) {
            this._rangeStack = day.date >= this._rangeStack[0] ? [this._rangeStack[0], day.date] : [day.date];
        }
        if (this._config.maxDateRange) {
            this.setMaxDateRangeOnCalendar(day.date);
        }
        if (this._rangeStack.length === 0) {
            this._rangeStack = [day.date];
            if (this._config.maxDateRange) {
                this.setMaxDateRangeOnCalendar(day.date);
            }
        }
        this._store.dispatch(this._actions.selectRange(this._rangeStack));
        if (this._rangeStack.length === 2) {
            this._rangeStack = [];
        }
    }
    ngOnDestroy() {
        for (const sub of this._subs) {
            sub.unsubscribe();
        }
        this.selectedTimeSub.unsubscribe();
        this._effects?.destroy();
    }
    setRangeOnCalendar(dates) {
        if (dates) {
            this._rangeStack = dates.value instanceof Date ? [dates.value] : dates.value;
        }
        this._store.dispatch(this._actions.selectRange(this._rangeStack));
    }
    setMaxDateRangeOnCalendar(currentSelection) {
        let maxDateRange = new Date(currentSelection);
        if (this._config.maxDate) {
            const maxDateValueInMilliseconds = this._config.maxDate.getTime();
            const maxDateRangeInMilliseconds = currentSelection.getTime() + (this._config.maxDateRange || 0) * dayInMilliseconds;
            maxDateRange =
                maxDateRangeInMilliseconds > maxDateValueInMilliseconds
                    ? new Date(this._config.maxDate)
                    : new Date(maxDateRangeInMilliseconds);
        }
        else {
            maxDateRange.setDate(currentSelection.getDate() + (this._config.maxDateRange || 0));
        }
        this._effects?.setMaxDate(maxDateRange);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: BsDaterangepickerContainerComponent, deps: [{ token: i0.Renderer2 }, { token: i1.BsDatepickerConfig }, { token: i2.BsDatepickerStore }, { token: i0.ElementRef }, { token: i3.BsDatepickerActions }, { token: i4.BsDatepickerEffects }, { token: i5.PositioningService }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.0.4", type: BsDaterangepickerContainerComponent, selector: "bs-daterangepicker-container", host: { attributes: { "role": "dialog", "aria-label": "calendar" }, listeners: { "click": "_stopPropagation($event)" }, properties: { "attr.disabled": "this.isDatepickerDisabled", "attr.readonly": "this.isDatepickerReadonly" }, classAttribute: "bottom" }, providers: [BsDatepickerStore, BsDatepickerEffects], viewQueries: [{ propertyName: "startTimepicker", first: true, predicate: ["startTP"], descendants: true }, { propertyName: "endTimepicker", first: true, predicate: ["endTP"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<!-- days calendar view mode -->\n<div class=\"bs-datepicker\" [ngClass]=\"containerClass\" *ngIf=\"viewMode | async\">\n  <div class=\"bs-datepicker-container\"\n    [@datepickerAnimation]=\"animationState\"\n    (@datepickerAnimation.done)=\"positionServiceEnable()\">\n    <!--calendars-->\n    <div class=\"bs-calendar-container\" [ngSwitch]=\"viewMode | async\" role=\"application\">\n      <!--days calendar-->\n      <ng-container *ngSwitchCase=\"'day'\">\n        <div class=\"bs-media-container\">\n          <bs-days-calendar-view\n            *ngFor=\"let calendar of daysCalendar$ | async\"\n            [class.bs-datepicker-multiple]=\"multipleCalendars\"\n            [calendar]=\"calendar\"\n            [isDisabled]=\"isDatePickerDisabled\"\n            [options]=\"options$ | async\"\n            (onNavigate)=\"navigateTo($event)\"\n            (onViewMode)=\"setViewMode($event)\"\n            (onHover)=\"dayHoverHandler($event)\"\n            (onHoverWeek)=\"weekHoverHandler($event)\"\n            (onSelect)=\"daySelectHandler($event)\">\n          </bs-days-calendar-view>\n        </div>\n        <div *ngIf=\"withTimepicker\" class=\"bs-timepicker-in-datepicker-container\">\n          <timepicker #startTP [disabled]=\"isDatePickerDisabled\"></timepicker>\n          <timepicker #endTP *ngIf=\"isRangePicker\" [disabled]=\"isDatePickerDisabled\"></timepicker>\n        </div>\n      </ng-container>\n\n      <!--months calendar-->\n      <div *ngSwitchCase=\"'month'\" class=\"bs-media-container\">\n        <bs-month-calendar-view\n          *ngFor=\"let calendar of monthsCalendar | async\"\n          [class.bs-datepicker-multiple]=\"multipleCalendars\"\n          [calendar]=\"calendar\"\n          (onNavigate)=\"navigateTo($event)\"\n          (onViewMode)=\"setViewMode($event)\"\n          (onHover)=\"monthHoverHandler($event)\"\n          (onSelect)=\"monthSelectHandler($event)\">\n        </bs-month-calendar-view>\n      </div>\n\n      <!--years calendar-->\n      <div *ngSwitchCase=\"'year'\" class=\"bs-media-container\">\n        <bs-years-calendar-view\n          *ngFor=\"let calendar of yearsCalendar | async\"\n          [class.bs-datepicker-multiple]=\"multipleCalendars\"\n          [calendar]=\"calendar\"\n          (onNavigate)=\"navigateTo($event)\"\n          (onViewMode)=\"setViewMode($event)\"\n          (onHover)=\"yearHoverHandler($event)\"\n          (onSelect)=\"yearSelectHandler($event)\">\n        </bs-years-calendar-view>\n      </div>\n    </div>\n\n    <!--applycancel buttons-->\n    <div class=\"bs-datepicker-buttons\" *ngIf=\"false\">\n      <button class=\"btn btn-success\" type=\"button\">Apply</button>\n      <button class=\"btn btn-default\" type=\"button\">Cancel</button>\n    </div>\n\n    <div class=\"bs-datepicker-buttons\" *ngIf=\"showTodayBtn || showClearBtn\">\n      <div class=\"btn-today-wrapper\"\n           [class.today-left]=\"todayPos === 'left'\"\n           [class.today-right]=\"todayPos === 'right'\"\n           [class.today-center]=\"todayPos === 'center'\"\n           *ngIf=\"showTodayBtn\">\n        <button class=\"btn btn-success\" (click)=\"setToday()\">{{todayBtnLbl}}</button>\n      </div>\n\n        <div class=\"btn-clear-wrapper\"\n        [class.clear-left]=\"clearPos === 'left'\"\n        [class.clear-right]=\"clearPos === 'right'\"\n        [class.clear-center]=\"clearPos === 'center'\"\n        *ngIf=\"showClearBtn\">\n          <button class=\"btn btn-success\" (click)=\"clearDate()\">{{clearBtnLbl}}</button>\n        </div>\n    </div>\n\n  </div>\n\n  <!--custom dates or date ranges picker-->\n  <div class=\"bs-datepicker-custom-range\" *ngIf=\"customRanges && customRanges.length > 0\">\n    <bs-custom-date-view\n      [selectedRange]=\"chosenRange\"\n      [ranges]=\"customRanges\"\n      [customRangeLabel]=\"customRangeBtnLbl\"\n      (onSelect)=\"setRangeOnCalendar($event)\">\n    </bs-custom-date-view>\n  </div>\n</div>\n", dependencies: [{ kind: "directive", type: i6.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i6.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i6.NgSwitch, selector: "[ngSwitch]", inputs: ["ngSwitch"] }, { kind: "directive", type: i6.NgSwitchCase, selector: "[ngSwitchCase]", inputs: ["ngSwitchCase"] }, { kind: "component", type: i7.TimepickerComponent, selector: "timepicker", inputs: ["hourStep", "minuteStep", "secondsStep", "readonlyInput", "disabled", "mousewheel", "arrowkeys", "showSpinners", "showMeridian", "showMinutes", "showSeconds", "meridians", "min", "max", "hoursPlaceholder", "minutesPlaceholder", "secondsPlaceholder"], outputs: ["isValid", "meridianChange"] }, { kind: "component", type: i8.BsCustomDatesViewComponent, selector: "bs-custom-date-view", inputs: ["ranges", "selectedRange", "customRangeLabel"], outputs: ["onSelect"] }, { kind: "component", type: i9.BsDaysCalendarViewComponent, selector: "bs-days-calendar-view", inputs: ["calendar", "options", "isDisabled"], outputs: ["onNavigate", "onViewMode", "onSelect", "onHover", "onHoverWeek"] }, { kind: "component", type: i10.BsMonthCalendarViewComponent, selector: "bs-month-calendar-view", inputs: ["calendar"], outputs: ["onNavigate", "onViewMode", "onSelect", "onHover"] }, { kind: "component", type: i11.BsYearsCalendarViewComponent, selector: "bs-years-calendar-view", inputs: ["calendar"], outputs: ["onNavigate", "onViewMode", "onSelect", "onHover"] }, { kind: "pipe", type: i6.AsyncPipe, name: "async" }], animations: [datepickerAnimation] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: BsDaterangepickerContainerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'bs-daterangepicker-container', providers: [BsDatepickerStore, BsDatepickerEffects], host: {
                        class: 'bottom',
                        '(click)': '_stopPropagation($event)',
                        role: 'dialog',
                        'aria-label': 'calendar'
                    }, animations: [datepickerAnimation], template: "<!-- days calendar view mode -->\n<div class=\"bs-datepicker\" [ngClass]=\"containerClass\" *ngIf=\"viewMode | async\">\n  <div class=\"bs-datepicker-container\"\n    [@datepickerAnimation]=\"animationState\"\n    (@datepickerAnimation.done)=\"positionServiceEnable()\">\n    <!--calendars-->\n    <div class=\"bs-calendar-container\" [ngSwitch]=\"viewMode | async\" role=\"application\">\n      <!--days calendar-->\n      <ng-container *ngSwitchCase=\"'day'\">\n        <div class=\"bs-media-container\">\n          <bs-days-calendar-view\n            *ngFor=\"let calendar of daysCalendar$ | async\"\n            [class.bs-datepicker-multiple]=\"multipleCalendars\"\n            [calendar]=\"calendar\"\n            [isDisabled]=\"isDatePickerDisabled\"\n            [options]=\"options$ | async\"\n            (onNavigate)=\"navigateTo($event)\"\n            (onViewMode)=\"setViewMode($event)\"\n            (onHover)=\"dayHoverHandler($event)\"\n            (onHoverWeek)=\"weekHoverHandler($event)\"\n            (onSelect)=\"daySelectHandler($event)\">\n          </bs-days-calendar-view>\n        </div>\n        <div *ngIf=\"withTimepicker\" class=\"bs-timepicker-in-datepicker-container\">\n          <timepicker #startTP [disabled]=\"isDatePickerDisabled\"></timepicker>\n          <timepicker #endTP *ngIf=\"isRangePicker\" [disabled]=\"isDatePickerDisabled\"></timepicker>\n        </div>\n      </ng-container>\n\n      <!--months calendar-->\n      <div *ngSwitchCase=\"'month'\" class=\"bs-media-container\">\n        <bs-month-calendar-view\n          *ngFor=\"let calendar of monthsCalendar | async\"\n          [class.bs-datepicker-multiple]=\"multipleCalendars\"\n          [calendar]=\"calendar\"\n          (onNavigate)=\"navigateTo($event)\"\n          (onViewMode)=\"setViewMode($event)\"\n          (onHover)=\"monthHoverHandler($event)\"\n          (onSelect)=\"monthSelectHandler($event)\">\n        </bs-month-calendar-view>\n      </div>\n\n      <!--years calendar-->\n      <div *ngSwitchCase=\"'year'\" class=\"bs-media-container\">\n        <bs-years-calendar-view\n          *ngFor=\"let calendar of yearsCalendar | async\"\n          [class.bs-datepicker-multiple]=\"multipleCalendars\"\n          [calendar]=\"calendar\"\n          (onNavigate)=\"navigateTo($event)\"\n          (onViewMode)=\"setViewMode($event)\"\n          (onHover)=\"yearHoverHandler($event)\"\n          (onSelect)=\"yearSelectHandler($event)\">\n        </bs-years-calendar-view>\n      </div>\n    </div>\n\n    <!--applycancel buttons-->\n    <div class=\"bs-datepicker-buttons\" *ngIf=\"false\">\n      <button class=\"btn btn-success\" type=\"button\">Apply</button>\n      <button class=\"btn btn-default\" type=\"button\">Cancel</button>\n    </div>\n\n    <div class=\"bs-datepicker-buttons\" *ngIf=\"showTodayBtn || showClearBtn\">\n      <div class=\"btn-today-wrapper\"\n           [class.today-left]=\"todayPos === 'left'\"\n           [class.today-right]=\"todayPos === 'right'\"\n           [class.today-center]=\"todayPos === 'center'\"\n           *ngIf=\"showTodayBtn\">\n        <button class=\"btn btn-success\" (click)=\"setToday()\">{{todayBtnLbl}}</button>\n      </div>\n\n        <div class=\"btn-clear-wrapper\"\n        [class.clear-left]=\"clearPos === 'left'\"\n        [class.clear-right]=\"clearPos === 'right'\"\n        [class.clear-center]=\"clearPos === 'center'\"\n        *ngIf=\"showClearBtn\">\n          <button class=\"btn btn-success\" (click)=\"clearDate()\">{{clearBtnLbl}}</button>\n        </div>\n    </div>\n\n  </div>\n\n  <!--custom dates or date ranges picker-->\n  <div class=\"bs-datepicker-custom-range\" *ngIf=\"customRanges && customRanges.length > 0\">\n    <bs-custom-date-view\n      [selectedRange]=\"chosenRange\"\n      [ranges]=\"customRanges\"\n      [customRangeLabel]=\"customRangeBtnLbl\"\n      (onSelect)=\"setRangeOnCalendar($event)\">\n    </bs-custom-date-view>\n  </div>\n</div>\n" }]
        }], ctorParameters: () => [{ type: i0.Renderer2 }, { type: i1.BsDatepickerConfig }, { type: i2.BsDatepickerStore }, { type: i0.ElementRef }, { type: i3.BsDatepickerActions }, { type: i4.BsDatepickerEffects }, { type: i5.PositioningService }], propDecorators: { startTimepicker: [{
                type: ViewChild,
                args: ['startTP']
            }], endTimepicker: [{
                type: ViewChild,
                args: ['endTP']
            }], isDatepickerDisabled: [{
                type: HostBinding,
                args: ['attr.disabled']
            }], isDatepickerReadonly: [{
                type: HostBinding,
                args: ['attr.readonly']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnMtZGF0ZXJhbmdlcGlja2VyLWNvbnRhaW5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvZGF0ZXBpY2tlci90aGVtZXMvYnMvYnMtZGF0ZXJhbmdlcGlja2VyLWNvbnRhaW5lci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvZGF0ZXBpY2tlci90aGVtZXMvYnMvYnMtZGF0ZXBpY2tlci12aWV3Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFdBQVcsRUFHWCxTQUFTLEVBQ1QsU0FBUyxFQUNWLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUd0QyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQy9ELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRS9ELE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBQ25GLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRWhFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBQ3RFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBRWxFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDOzs7Ozs7Ozs7Ozs7O0FBYzVELE1BQU0sT0FBTyxtQ0FDWCxTQUFR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bUNBQW1DLHVUQVZuQyxDQUFDLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLHNQQy9CckQsNDNIQTRGQSw4ckREckRjLENBQUMsbUJBQW1CLENBQUM7OzJGQUV0QixtQ0FBbUM7a0JBWi9DLFNBQVM7K0JBQ0UsOEJBQThCLGFBQzdCLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsUUFFN0M7d0JBQ0osS0FBSyxFQUFFLFFBQVE7d0JBQ2YsU0FBUyxFQUFFLDBCQUEwQjt3QkFDckMsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsWUFBWSxFQUFFLFVBQVU7cUJBQ3pCLGNBQ1csQ0FBQyxtQkFBbUIsQ0FBQzs2UUFrQlgsZUFBZTtzQkFBcEMsU0FBUzt1QkFBQyxTQUFTO2dCQUNBLGFBQWE7c0JBQWhDLFNBQVM7dUJBQUMsT0FBTztnQkFNZ0Isb0JBQW9CO3NCQUFyRCxXQUFXO3VCQUFDLGVBQWU7Z0JBSU0sb0JBQW9CO3NCQUFyRCxXQUFXO3VCQUFDLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSG9zdEJpbmRpbmcsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBSZW5kZXJlcjIsXG4gIFZpZXdDaGlsZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHsgdGFrZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQgeyBnZXRGdWxsWWVhciwgZ2V0TW9udGggfSBmcm9tICduZ3gtYm9vdHN0cmFwL2Nocm9ub3MnO1xuaW1wb3J0IHsgUG9zaXRpb25pbmdTZXJ2aWNlIH0gZnJvbSAnbmd4LWJvb3RzdHJhcC9wb3NpdGlvbmluZyc7XG5pbXBvcnQgeyBUaW1lcGlja2VyQ29tcG9uZW50IH0gZnJvbSAnbmd4LWJvb3RzdHJhcC90aW1lcGlja2VyJztcblxuaW1wb3J0IHsgQnNEYXRlcGlja2VyQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tICcuLi8uLi9iYXNlL2JzLWRhdGVwaWNrZXItY29udGFpbmVyJztcbmltcG9ydCB7IEJzRGF0ZXBpY2tlckNvbmZpZyB9IGZyb20gJy4uLy4uL2JzLWRhdGVwaWNrZXIuY29uZmlnJztcbmltcG9ydCB7IENhbGVuZGFyQ2VsbFZpZXdNb2RlbCwgRGF5Vmlld01vZGVsIH0gZnJvbSAnLi4vLi4vbW9kZWxzJztcbmltcG9ydCB7IEJzRGF0ZXBpY2tlckFjdGlvbnMgfSBmcm9tICcuLi8uLi9yZWR1Y2VyL2JzLWRhdGVwaWNrZXIuYWN0aW9ucyc7XG5pbXBvcnQgeyBCc0RhdGVwaWNrZXJFZmZlY3RzIH0gZnJvbSAnLi4vLi4vcmVkdWNlci9icy1kYXRlcGlja2VyLmVmZmVjdHMnO1xuaW1wb3J0IHsgQnNEYXRlcGlja2VyU3RvcmUgfSBmcm9tICcuLi8uLi9yZWR1Y2VyL2JzLWRhdGVwaWNrZXIuc3RvcmUnO1xuaW1wb3J0IHsgZGF0ZXBpY2tlckFuaW1hdGlvbiB9IGZyb20gJy4uLy4uL2RhdGVwaWNrZXItYW5pbWF0aW9ucyc7XG5pbXBvcnQgeyBCc0N1c3RvbURhdGVzIH0gZnJvbSAnLi9icy1jdXN0b20tZGF0ZXMtdmlldy5jb21wb25lbnQnO1xuaW1wb3J0IHsgZGF5SW5NaWxsaXNlY29uZHMgfSBmcm9tICcuLi8uLi9yZWR1Y2VyL19kZWZhdWx0cyc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2JzLWRhdGVyYW5nZXBpY2tlci1jb250YWluZXInLFxuICBwcm92aWRlcnM6IFtCc0RhdGVwaWNrZXJTdG9yZSwgQnNEYXRlcGlja2VyRWZmZWN0c10sXG4gIHRlbXBsYXRlVXJsOiAnLi9icy1kYXRlcGlja2VyLXZpZXcuaHRtbCcsXG4gIGhvc3Q6IHtcbiAgICBjbGFzczogJ2JvdHRvbScsXG4gICAgJyhjbGljayknOiAnX3N0b3BQcm9wYWdhdGlvbigkZXZlbnQpJyxcbiAgICByb2xlOiAnZGlhbG9nJyxcbiAgICAnYXJpYS1sYWJlbCc6ICdjYWxlbmRhcidcbiAgfSxcbiAgYW5pbWF0aW9uczogW2RhdGVwaWNrZXJBbmltYXRpb25dXG59KVxuZXhwb3J0IGNsYXNzIEJzRGF0ZXJhbmdlcGlja2VyQ29udGFpbmVyQ29tcG9uZW50XG4gIGV4dGVuZHMgQnNEYXRlcGlja2VyQWJzdHJhY3RDb21wb25lbnRcbiAgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdFxue1xuICBzZXQgdmFsdWUodmFsdWU6IChEYXRlIHwgdW5kZWZpbmVkKVtdIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fZWZmZWN0cz8uc2V0UmFuZ2VWYWx1ZSh2YWx1ZSk7XG4gIH1cblxuICB2YWx1ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RGF0ZVtdPigpO1xuICBhbmltYXRpb25TdGF0ZSA9ICd2b2lkJztcblxuICBfcmFuZ2VTdGFjazogRGF0ZVtdID0gW107XG4gIG92ZXJyaWRlIGNob3NlblJhbmdlOiBEYXRlW10gPSBbXTtcbiAgX3N1YnM6IFN1YnNjcmlwdGlvbltdID0gW107XG4gIG92ZXJyaWRlIGlzUmFuZ2VQaWNrZXIgPSB0cnVlO1xuXG4gIEBWaWV3Q2hpbGQoJ3N0YXJ0VFAnKSBzdGFydFRpbWVwaWNrZXI/OiBUaW1lcGlja2VyQ29tcG9uZW50O1xuICBAVmlld0NoaWxkKCdlbmRUUCcpIGVuZFRpbWVwaWNrZXI/OiBUaW1lcGlja2VyQ29tcG9uZW50O1xuXG4gIGdldCBpc0RhdGVQaWNrZXJEaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLl9jb25maWcuaXNEaXNhYmxlZDtcbiAgfVxuXG4gIEBIb3N0QmluZGluZygnYXR0ci5kaXNhYmxlZCcpIGdldCBpc0RhdGVwaWNrZXJEaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0RhdGVQaWNrZXJEaXNhYmxlZCA/ICcnIDogbnVsbDtcbiAgfVxuXG4gIEBIb3N0QmluZGluZygnYXR0ci5yZWFkb25seScpIGdldCBpc0RhdGVwaWNrZXJSZWFkb25seSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0RhdGVQaWNrZXJEaXNhYmxlZCA/ICcnIDogbnVsbDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIF9yZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIHByaXZhdGUgX2NvbmZpZzogQnNEYXRlcGlja2VyQ29uZmlnLFxuICAgIHByaXZhdGUgX3N0b3JlOiBCc0RhdGVwaWNrZXJTdG9yZSxcbiAgICBwcml2YXRlIF9lbGVtZW50OiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgX2FjdGlvbnM6IEJzRGF0ZXBpY2tlckFjdGlvbnMsXG4gICAgX2VmZmVjdHM6IEJzRGF0ZXBpY2tlckVmZmVjdHMsXG4gICAgcHJpdmF0ZSBfcG9zaXRpb25TZXJ2aWNlOiBQb3NpdGlvbmluZ1NlcnZpY2VcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9lZmZlY3RzID0gX2VmZmVjdHM7XG5cbiAgICB0aGlzLmN1c3RvbVJhbmdlcyA9IHRoaXMuX2NvbmZpZy5yYW5nZXMgfHwgW107XG4gICAgdGhpcy5jdXN0b21SYW5nZUJ0bkxibCA9IHRoaXMuX2NvbmZpZy5jdXN0b21SYW5nZUJ1dHRvbkxhYmVsO1xuXG4gICAgX3JlbmRlcmVyLnNldFN0eWxlKF9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgX3JlbmRlcmVyLnNldFN0eWxlKF9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsICdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5fcG9zaXRpb25TZXJ2aWNlLnNldE9wdGlvbnMoe1xuICAgICAgbW9kaWZpZXJzOiB7XG4gICAgICAgIGZsaXA6IHtcbiAgICAgICAgICBlbmFibGVkOiB0aGlzLl9jb25maWcuYWRhcHRpdmVQb3NpdGlvblxuICAgICAgICB9LFxuICAgICAgICBwcmV2ZW50T3ZlcmZsb3c6IHtcbiAgICAgICAgICBlbmFibGVkOiB0aGlzLl9jb25maWcuYWRhcHRpdmVQb3NpdGlvblxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYWxsb3dlZFBvc2l0aW9uczogdGhpcy5fY29uZmlnLmFsbG93ZWRQb3NpdGlvbnNcbiAgICB9KTtcblxuICAgIHRoaXMuX3Bvc2l0aW9uU2VydmljZS5ldmVudCQ/LnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU2VydmljZS5kaXNhYmxlKCk7XG5cbiAgICAgIGlmICh0aGlzLl9jb25maWcuaXNBbmltYXRlZCkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvblN0YXRlID0gdGhpcy5pc1RvcFBvc2l0aW9uID8gJ2FuaW1hdGVkLXVwJyA6ICdhbmltYXRlZC1kb3duJztcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYW5pbWF0aW9uU3RhdGUgPSAndW5hbmltYXRlZCc7XG4gICAgfSk7XG4gICAgdGhpcy5jb250YWluZXJDbGFzcyA9IHRoaXMuX2NvbmZpZy5jb250YWluZXJDbGFzcztcbiAgICB0aGlzLmlzT3RoZXJNb250aHNBY3RpdmUgPSB0aGlzLl9jb25maWcuc2VsZWN0RnJvbU90aGVyTW9udGg7XG4gICAgdGhpcy53aXRoVGltZXBpY2tlciA9IHRoaXMuX2NvbmZpZy53aXRoVGltZXBpY2tlcjtcbiAgICB0aGlzLl9lZmZlY3RzXG4gICAgICA/LmluaXQodGhpcy5fc3RvcmUpXG4gICAgICAvLyBpbnRpYWwgc3RhdGUgb3B0aW9uc1xuICAgICAgLy8gdG9kbzogZml4IHRoaXMsIHNwbGl0IGNvbmZpZ3NcbiAgICAgIC5zZXRPcHRpb25zKHRoaXMuX2NvbmZpZylcbiAgICAgIC8vIGRhdGEgYmluZGluZyB2aWV3IC0tPiBtb2RlbFxuICAgICAgLnNldEJpbmRpbmdzKHRoaXMpXG4gICAgICAvLyBzZXQgZXZlbnQgaGFuZGxlcnNcbiAgICAgIC5zZXRFdmVudEhhbmRsZXJzKHRoaXMpXG4gICAgICAucmVnaXN0ZXJEYXRlcGlja2VyU2lkZUVmZmVjdHMoKTtcbiAgICBsZXQgY3VycmVudERhdGU6IERhdGVbXSB8IHVuZGVmaW5lZDtcbiAgICAvLyB0b2RvOiBtb3ZlIGl0IHNvbWV3aGVyZSBlbHNlXG4gICAgLy8gb24gc2VsZWN0ZWQgZGF0ZSBjaGFuZ2VcbiAgICB0aGlzLl9zdWJzLnB1c2goXG4gICAgICB0aGlzLl9zdG9yZVxuICAgICAgICAuc2VsZWN0KChzdGF0ZSkgPT4gc3RhdGUuc2VsZWN0ZWRSYW5nZSlcbiAgICAgICAgLnN1YnNjcmliZSgoZGF0ZVJhbmdlKSA9PiB7XG4gICAgICAgICAgY3VycmVudERhdGUgPSBkYXRlUmFuZ2U7XG4gICAgICAgICAgdGhpcy52YWx1ZUNoYW5nZS5lbWl0KGRhdGVSYW5nZSk7XG4gICAgICAgICAgdGhpcy5jaG9zZW5SYW5nZSA9IGRhdGVSYW5nZSB8fCBbXTtcbiAgICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5fc3Vicy5wdXNoKFxuICAgICAgdGhpcy5fc3RvcmVcbiAgICAgICAgLnNlbGVjdCgoc3RhdGUpID0+IHN0YXRlLnNlbGVjdGVkVGltZSlcbiAgICAgICAgLnN1YnNjcmliZSgodGltZSkgPT4ge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICF0aW1lIHx8XG4gICAgICAgICAgICAhdGltZVswXSB8fFxuICAgICAgICAgICAgIXRpbWVbMV0gfHxcbiAgICAgICAgICAgICEodGltZVswXSBpbnN0YW5jZW9mIERhdGUpIHx8XG4gICAgICAgICAgICAhKHRpbWVbMV0gaW5zdGFuY2VvZiBEYXRlKSB8fFxuICAgICAgICAgICAgKGN1cnJlbnREYXRlICYmIHRpbWVbMF0gPT09IGN1cnJlbnREYXRlWzBdICYmIHRpbWVbMV0gPT09IGN1cnJlbnREYXRlWzFdKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMudmFsdWVDaGFuZ2UuZW1pdCh0aW1lKTtcbiAgICAgICAgICB0aGlzLmNob3NlblJhbmdlID0gdGltZSB8fCBbXTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRUaW1lU3ViLmFkZChcbiAgICAgIHRoaXMuc2VsZWN0ZWRUaW1lPy5zdWJzY3JpYmUoKHZhbCkgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPj0gMikge1xuICAgICAgICAgIHRoaXMuc3RhcnRUaW1lcGlja2VyPy53cml0ZVZhbHVlKHZhbFswXSk7XG4gICAgICAgICAgdGhpcy5lbmRUaW1lcGlja2VyPy53cml0ZVZhbHVlKHZhbFsxXSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnN0YXJ0VGltZXBpY2tlcj8ucmVnaXN0ZXJPbkNoYW5nZSgodmFsKSA9PiB7XG4gICAgICB0aGlzLnRpbWVTZWxlY3RIYW5kbGVyKHZhbCwgMCk7XG4gICAgfSk7XG4gICAgdGhpcy5lbmRUaW1lcGlja2VyPy5yZWdpc3Rlck9uQ2hhbmdlKCh2YWwpID0+IHtcbiAgICAgIHRoaXMudGltZVNlbGVjdEhhbmRsZXIodmFsLCAxKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBpc1RvcFBvc2l0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0b3AnKTtcbiAgfVxuXG4gIHBvc2l0aW9uU2VydmljZUVuYWJsZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9wb3NpdGlvblNlcnZpY2UuZW5hYmxlKCk7XG4gIH1cblxuICBvdmVycmlkZSB0aW1lU2VsZWN0SGFuZGxlcihkYXRlOiBEYXRlLCBpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2godGhpcy5fYWN0aW9ucy5zZWxlY3RUaW1lKGRhdGUsIGluZGV4KSk7XG4gIH1cblxuICBvdmVycmlkZSBkYXlTZWxlY3RIYW5kbGVyKGRheTogRGF5Vmlld01vZGVsKTogdm9pZCB7XG4gICAgaWYgKCFkYXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaXNEaXNhYmxlZCA9IHRoaXMuaXNPdGhlck1vbnRoc0FjdGl2ZSA/IGRheS5pc0Rpc2FibGVkIDogZGF5LmlzT3RoZXJNb250aCB8fCBkYXkuaXNEaXNhYmxlZDtcblxuICAgIGlmIChpc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmFuZ2VzUHJvY2Vzc2luZyhkYXkpO1xuICB9XG5cbiAgb3ZlcnJpZGUgbW9udGhTZWxlY3RIYW5kbGVyKGRheTogQ2FsZW5kYXJDZWxsVmlld01vZGVsKTogdm9pZCB7XG4gICAgaWYgKCFkYXkgfHwgZGF5LmlzRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkYXkuaXNTZWxlY3RlZCA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLm1pbk1vZGUgIT09ICdtb250aCcpIHtcbiAgICAgIGlmIChkYXkuaXNEaXNhYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChcbiAgICAgICAgdGhpcy5fYWN0aW9ucy5uYXZpZ2F0ZVRvKHtcbiAgICAgICAgICB1bml0OiB7XG4gICAgICAgICAgICBtb250aDogZ2V0TW9udGgoZGF5LmRhdGUpLFxuICAgICAgICAgICAgeWVhcjogZ2V0RnVsbFllYXIoZGF5LmRhdGUpXG4gICAgICAgICAgfSxcbiAgICAgICAgICB2aWV3TW9kZTogJ2RheSdcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yYW5nZXNQcm9jZXNzaW5nKGRheSk7XG4gIH1cblxuICBvdmVycmlkZSB5ZWFyU2VsZWN0SGFuZGxlcihkYXk6IENhbGVuZGFyQ2VsbFZpZXdNb2RlbCk6IHZvaWQge1xuICAgIGlmICghZGF5IHx8IGRheS5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGF5LmlzU2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5taW5Nb2RlICE9PSAneWVhcicpIHtcbiAgICAgIGlmIChkYXkuaXNEaXNhYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChcbiAgICAgICAgdGhpcy5fYWN0aW9ucy5uYXZpZ2F0ZVRvKHtcbiAgICAgICAgICB1bml0OiB7XG4gICAgICAgICAgICB5ZWFyOiBnZXRGdWxsWWVhcihkYXkuZGF0ZSlcbiAgICAgICAgICB9LFxuICAgICAgICAgIHZpZXdNb2RlOiAnbW9udGgnXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucmFuZ2VzUHJvY2Vzc2luZyhkYXkpO1xuICB9XG5cbiAgcmFuZ2VzUHJvY2Vzc2luZyhkYXk6IENhbGVuZGFyQ2VsbFZpZXdNb2RlbCk6IHZvaWQge1xuICAgIC8vIGlmIG9ubHkgb25lIGRhdGUgaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgIC8vIGFuZCB1c2VyIGNsaWNrcyBvbiBwcmV2aW91cyBkYXRlXG4gICAgLy8gc3RhcnQgc2VsZWN0aW9uIGZyb20gbmV3IGRhdGVcbiAgICAvLyBidXQgaWYgbmV3IGRhdGUgaXMgYWZ0ZXIgaW5pdGlhbCBvbmVcbiAgICAvLyB0aGFuIGZpbmlzaCBzZWxlY3Rpb25cblxuICAgIGlmICh0aGlzLl9yYW5nZVN0YWNrLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5fcmFuZ2VTdGFjayA9IGRheS5kYXRlID49IHRoaXMuX3JhbmdlU3RhY2tbMF0gPyBbdGhpcy5fcmFuZ2VTdGFja1swXSwgZGF5LmRhdGVdIDogW2RheS5kYXRlXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLm1heERhdGVSYW5nZSkge1xuICAgICAgdGhpcy5zZXRNYXhEYXRlUmFuZ2VPbkNhbGVuZGFyKGRheS5kYXRlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcmFuZ2VTdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX3JhbmdlU3RhY2sgPSBbZGF5LmRhdGVdO1xuXG4gICAgICBpZiAodGhpcy5fY29uZmlnLm1heERhdGVSYW5nZSkge1xuICAgICAgICB0aGlzLnNldE1heERhdGVSYW5nZU9uQ2FsZW5kYXIoZGF5LmRhdGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKHRoaXMuX2FjdGlvbnMuc2VsZWN0UmFuZ2UodGhpcy5fcmFuZ2VTdGFjaykpO1xuXG4gICAgaWYgKHRoaXMuX3JhbmdlU3RhY2subGVuZ3RoID09PSAyKSB7XG4gICAgICB0aGlzLl9yYW5nZVN0YWNrID0gW107XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBzdWIgb2YgdGhpcy5fc3Vicykge1xuICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRUaW1lU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fZWZmZWN0cz8uZGVzdHJveSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2V0UmFuZ2VPbkNhbGVuZGFyKGRhdGVzOiBCc0N1c3RvbURhdGVzKTogdm9pZCB7XG4gICAgaWYgKGRhdGVzKSB7XG4gICAgICB0aGlzLl9yYW5nZVN0YWNrID0gZGF0ZXMudmFsdWUgaW5zdGFuY2VvZiBEYXRlID8gW2RhdGVzLnZhbHVlXSA6IGRhdGVzLnZhbHVlO1xuICAgIH1cbiAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaCh0aGlzLl9hY3Rpb25zLnNlbGVjdFJhbmdlKHRoaXMuX3JhbmdlU3RhY2spKTtcbiAgfVxuXG4gIHNldE1heERhdGVSYW5nZU9uQ2FsZW5kYXIoY3VycmVudFNlbGVjdGlvbjogRGF0ZSk6IHZvaWQge1xuICAgIGxldCBtYXhEYXRlUmFuZ2UgPSBuZXcgRGF0ZShjdXJyZW50U2VsZWN0aW9uKTtcblxuICAgIGlmICh0aGlzLl9jb25maWcubWF4RGF0ZSkge1xuICAgICAgY29uc3QgbWF4RGF0ZVZhbHVlSW5NaWxsaXNlY29uZHMgPSB0aGlzLl9jb25maWcubWF4RGF0ZS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBtYXhEYXRlUmFuZ2VJbk1pbGxpc2Vjb25kcyA9XG4gICAgICAgIGN1cnJlbnRTZWxlY3Rpb24uZ2V0VGltZSgpICsgKHRoaXMuX2NvbmZpZy5tYXhEYXRlUmFuZ2UgfHwgMCkgKiBkYXlJbk1pbGxpc2Vjb25kcztcbiAgICAgIG1heERhdGVSYW5nZSA9XG4gICAgICAgIG1heERhdGVSYW5nZUluTWlsbGlzZWNvbmRzID4gbWF4RGF0ZVZhbHVlSW5NaWxsaXNlY29uZHNcbiAgICAgICAgICA/IG5ldyBEYXRlKHRoaXMuX2NvbmZpZy5tYXhEYXRlKVxuICAgICAgICAgIDogbmV3IERhdGUobWF4RGF0ZVJhbmdlSW5NaWxsaXNlY29uZHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXhEYXRlUmFuZ2Uuc2V0RGF0ZShjdXJyZW50U2VsZWN0aW9uLmdldERhdGUoKSArICh0aGlzLl9jb25maWcubWF4RGF0ZVJhbmdlIHx8IDApKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lZmZlY3RzPy5zZXRNYXhEYXRlKG1heERhdGVSYW5nZSk7XG4gIH1cbn1cbiIsIjwhLS0gZGF5cyBjYWxlbmRhciB2aWV3IG1vZGUgLS0+XG48ZGl2IGNsYXNzPVwiYnMtZGF0ZXBpY2tlclwiIFtuZ0NsYXNzXT1cImNvbnRhaW5lckNsYXNzXCIgKm5nSWY9XCJ2aWV3TW9kZSB8IGFzeW5jXCI+XG4gIDxkaXYgY2xhc3M9XCJicy1kYXRlcGlja2VyLWNvbnRhaW5lclwiXG4gICAgW0BkYXRlcGlja2VyQW5pbWF0aW9uXT1cImFuaW1hdGlvblN0YXRlXCJcbiAgICAoQGRhdGVwaWNrZXJBbmltYXRpb24uZG9uZSk9XCJwb3NpdGlvblNlcnZpY2VFbmFibGUoKVwiPlxuICAgIDwhLS1jYWxlbmRhcnMtLT5cbiAgICA8ZGl2IGNsYXNzPVwiYnMtY2FsZW5kYXItY29udGFpbmVyXCIgW25nU3dpdGNoXT1cInZpZXdNb2RlIHwgYXN5bmNcIiByb2xlPVwiYXBwbGljYXRpb25cIj5cbiAgICAgIDwhLS1kYXlzIGNhbGVuZGFyLS0+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1N3aXRjaENhc2U9XCInZGF5J1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYnMtbWVkaWEtY29udGFpbmVyXCI+XG4gICAgICAgICAgPGJzLWRheXMtY2FsZW5kYXItdmlld1xuICAgICAgICAgICAgKm5nRm9yPVwibGV0IGNhbGVuZGFyIG9mIGRheXNDYWxlbmRhciQgfCBhc3luY1wiXG4gICAgICAgICAgICBbY2xhc3MuYnMtZGF0ZXBpY2tlci1tdWx0aXBsZV09XCJtdWx0aXBsZUNhbGVuZGFyc1wiXG4gICAgICAgICAgICBbY2FsZW5kYXJdPVwiY2FsZW5kYXJcIlxuICAgICAgICAgICAgW2lzRGlzYWJsZWRdPVwiaXNEYXRlUGlja2VyRGlzYWJsZWRcIlxuICAgICAgICAgICAgW29wdGlvbnNdPVwib3B0aW9ucyQgfCBhc3luY1wiXG4gICAgICAgICAgICAob25OYXZpZ2F0ZSk9XCJuYXZpZ2F0ZVRvKCRldmVudClcIlxuICAgICAgICAgICAgKG9uVmlld01vZGUpPVwic2V0Vmlld01vZGUoJGV2ZW50KVwiXG4gICAgICAgICAgICAob25Ib3Zlcik9XCJkYXlIb3ZlckhhbmRsZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICAob25Ib3ZlcldlZWspPVwid2Vla0hvdmVySGFuZGxlcigkZXZlbnQpXCJcbiAgICAgICAgICAgIChvblNlbGVjdCk9XCJkYXlTZWxlY3RIYW5kbGVyKCRldmVudClcIj5cbiAgICAgICAgICA8L2JzLWRheXMtY2FsZW5kYXItdmlldz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJ3aXRoVGltZXBpY2tlclwiIGNsYXNzPVwiYnMtdGltZXBpY2tlci1pbi1kYXRlcGlja2VyLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDx0aW1lcGlja2VyICNzdGFydFRQIFtkaXNhYmxlZF09XCJpc0RhdGVQaWNrZXJEaXNhYmxlZFwiPjwvdGltZXBpY2tlcj5cbiAgICAgICAgICA8dGltZXBpY2tlciAjZW5kVFAgKm5nSWY9XCJpc1JhbmdlUGlja2VyXCIgW2Rpc2FibGVkXT1cImlzRGF0ZVBpY2tlckRpc2FibGVkXCI+PC90aW1lcGlja2VyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICA8IS0tbW9udGhzIGNhbGVuZGFyLS0+XG4gICAgICA8ZGl2ICpuZ1N3aXRjaENhc2U9XCInbW9udGgnXCIgY2xhc3M9XCJicy1tZWRpYS1jb250YWluZXJcIj5cbiAgICAgICAgPGJzLW1vbnRoLWNhbGVuZGFyLXZpZXdcbiAgICAgICAgICAqbmdGb3I9XCJsZXQgY2FsZW5kYXIgb2YgbW9udGhzQ2FsZW5kYXIgfCBhc3luY1wiXG4gICAgICAgICAgW2NsYXNzLmJzLWRhdGVwaWNrZXItbXVsdGlwbGVdPVwibXVsdGlwbGVDYWxlbmRhcnNcIlxuICAgICAgICAgIFtjYWxlbmRhcl09XCJjYWxlbmRhclwiXG4gICAgICAgICAgKG9uTmF2aWdhdGUpPVwibmF2aWdhdGVUbygkZXZlbnQpXCJcbiAgICAgICAgICAob25WaWV3TW9kZSk9XCJzZXRWaWV3TW9kZSgkZXZlbnQpXCJcbiAgICAgICAgICAob25Ib3Zlcik9XCJtb250aEhvdmVySGFuZGxlcigkZXZlbnQpXCJcbiAgICAgICAgICAob25TZWxlY3QpPVwibW9udGhTZWxlY3RIYW5kbGVyKCRldmVudClcIj5cbiAgICAgICAgPC9icy1tb250aC1jYWxlbmRhci12aWV3PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS15ZWFycyBjYWxlbmRhci0tPlxuICAgICAgPGRpdiAqbmdTd2l0Y2hDYXNlPVwiJ3llYXInXCIgY2xhc3M9XCJicy1tZWRpYS1jb250YWluZXJcIj5cbiAgICAgICAgPGJzLXllYXJzLWNhbGVuZGFyLXZpZXdcbiAgICAgICAgICAqbmdGb3I9XCJsZXQgY2FsZW5kYXIgb2YgeWVhcnNDYWxlbmRhciB8IGFzeW5jXCJcbiAgICAgICAgICBbY2xhc3MuYnMtZGF0ZXBpY2tlci1tdWx0aXBsZV09XCJtdWx0aXBsZUNhbGVuZGFyc1wiXG4gICAgICAgICAgW2NhbGVuZGFyXT1cImNhbGVuZGFyXCJcbiAgICAgICAgICAob25OYXZpZ2F0ZSk9XCJuYXZpZ2F0ZVRvKCRldmVudClcIlxuICAgICAgICAgIChvblZpZXdNb2RlKT1cInNldFZpZXdNb2RlKCRldmVudClcIlxuICAgICAgICAgIChvbkhvdmVyKT1cInllYXJIb3ZlckhhbmRsZXIoJGV2ZW50KVwiXG4gICAgICAgICAgKG9uU2VsZWN0KT1cInllYXJTZWxlY3RIYW5kbGVyKCRldmVudClcIj5cbiAgICAgICAgPC9icy15ZWFycy1jYWxlbmRhci12aWV3PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tYXBwbHljYW5jZWwgYnV0dG9ucy0tPlxuICAgIDxkaXYgY2xhc3M9XCJicy1kYXRlcGlja2VyLWJ1dHRvbnNcIiAqbmdJZj1cImZhbHNlXCI+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgdHlwZT1cImJ1dHRvblwiPkFwcGx5PC9idXR0b24+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCIgdHlwZT1cImJ1dHRvblwiPkNhbmNlbDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cImJzLWRhdGVwaWNrZXItYnV0dG9uc1wiICpuZ0lmPVwic2hvd1RvZGF5QnRuIHx8IHNob3dDbGVhckJ0blwiPlxuICAgICAgPGRpdiBjbGFzcz1cImJ0bi10b2RheS13cmFwcGVyXCJcbiAgICAgICAgICAgW2NsYXNzLnRvZGF5LWxlZnRdPVwidG9kYXlQb3MgPT09ICdsZWZ0J1wiXG4gICAgICAgICAgIFtjbGFzcy50b2RheS1yaWdodF09XCJ0b2RheVBvcyA9PT0gJ3JpZ2h0J1wiXG4gICAgICAgICAgIFtjbGFzcy50b2RheS1jZW50ZXJdPVwidG9kYXlQb3MgPT09ICdjZW50ZXInXCJcbiAgICAgICAgICAgKm5nSWY9XCJzaG93VG9kYXlCdG5cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIChjbGljayk9XCJzZXRUb2RheSgpXCI+e3t0b2RheUJ0bkxibH19PC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwiYnRuLWNsZWFyLXdyYXBwZXJcIlxuICAgICAgICBbY2xhc3MuY2xlYXItbGVmdF09XCJjbGVhclBvcyA9PT0gJ2xlZnQnXCJcbiAgICAgICAgW2NsYXNzLmNsZWFyLXJpZ2h0XT1cImNsZWFyUG9zID09PSAncmlnaHQnXCJcbiAgICAgICAgW2NsYXNzLmNsZWFyLWNlbnRlcl09XCJjbGVhclBvcyA9PT0gJ2NlbnRlcidcIlxuICAgICAgICAqbmdJZj1cInNob3dDbGVhckJ0blwiPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXN1Y2Nlc3NcIiAoY2xpY2spPVwiY2xlYXJEYXRlKClcIj57e2NsZWFyQnRuTGJsfX08L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgPC9kaXY+XG5cbiAgPCEtLWN1c3RvbSBkYXRlcyBvciBkYXRlIHJhbmdlcyBwaWNrZXItLT5cbiAgPGRpdiBjbGFzcz1cImJzLWRhdGVwaWNrZXItY3VzdG9tLXJhbmdlXCIgKm5nSWY9XCJjdXN0b21SYW5nZXMgJiYgY3VzdG9tUmFuZ2VzLmxlbmd0aCA+IDBcIj5cbiAgICA8YnMtY3VzdG9tLWRhdGUtdmlld1xuICAgICAgW3NlbGVjdGVkUmFuZ2VdPVwiY2hvc2VuUmFuZ2VcIlxuICAgICAgW3Jhbmdlc109XCJjdXN0b21SYW5nZXNcIlxuICAgICAgW2N1c3RvbVJhbmdlTGFiZWxdPVwiY3VzdG9tUmFuZ2VCdG5MYmxcIlxuICAgICAgKG9uU2VsZWN0KT1cInNldFJhbmdlT25DYWxlbmRhcigkZXZlbnQpXCI+XG4gICAgPC9icy1jdXN0b20tZGF0ZS12aWV3PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19
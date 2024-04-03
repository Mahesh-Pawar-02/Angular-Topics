import { ChangeDetectionStrategy, Input, Component } from '@angular/core';
import { PopoverConfig } from './popover.config';
import { getBsVer } from 'ngx-bootstrap/utils';
import { PlacementForBs5, checkMargins } from 'ngx-bootstrap/positioning';
import * as i0 from "@angular/core";
import * as i1 from "./popover.config";
import * as i2 from "@angular/common";
export class PopoverContainerComponent {
    set placement(value) {
        if (!this._bsVersions.isBs5) {
            this._placement = value;
        }
        else {
            this._placement = PlacementForBs5[value];
        }
    }
    get _bsVersions() {
        return getBsVer();
    }
    constructor(config) {
        this._placement = 'top';
        Object.assign(this, config);
    }
    checkMarginNecessity() {
        return checkMargins(this._placement);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: PopoverContainerComponent, deps: [{ token: i1.PopoverConfig }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.0.4", type: PopoverContainerComponent, selector: "popover-container", inputs: { placement: "placement", title: "title" }, host: { attributes: { "role": "tooltip" }, properties: { "attr.id": "popoverId", "class": "\"popover in popover-\" + _placement + \" \" + \"bs-popover-\" + _placement + \" \" + _placement + \" \" + containerClass + \" \" + checkMarginNecessity()", "class.show": "!_bsVersions.isBs3", "class.bs3": "_bsVersions.isBs3" }, styleAttribute: "display:block; position:absolute" }, ngImport: i0, template: "<div class=\"popover-arrow arrow\"></div>\n<h3 class=\"popover-title popover-header\" *ngIf=\"title\">{{ title }}</h3>\n<div class=\"popover-content popover-body\">\n  <ng-content></ng-content>\n</div>\n", styles: [":host.popover.bottom>.arrow{margin-left:-4px}:host .popover-arrow{position:absolute}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: PopoverContainerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'popover-container', changeDetection: ChangeDetectionStrategy.OnPush, host: {
                        '[attr.id]': 'popoverId',
                        '[class]': '"popover in popover-" + _placement + " " + "bs-popover-" + _placement + " " + _placement + " " + containerClass + " " + checkMarginNecessity()',
                        '[class.show]': '!_bsVersions.isBs3',
                        '[class.bs3]': '_bsVersions.isBs3',
                        role: 'tooltip',
                        style: 'display:block; position:absolute'
                    }, template: "<div class=\"popover-arrow arrow\"></div>\n<h3 class=\"popover-title popover-header\" *ngIf=\"title\">{{ title }}</h3>\n<div class=\"popover-content popover-body\">\n  <ng-content></ng-content>\n</div>\n", styles: [":host.popover.bottom>.arrow{margin-left:-4px}:host .popover-arrow{position:absolute}\n"] }]
        }], ctorParameters: () => [{ type: i1.PopoverConfig }], propDecorators: { placement: [{
                type: Input
            }], title: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wb3Zlci1jb250YWluZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3BvcG92ZXIvcG9wb3Zlci1jb250YWluZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vc3JjL3BvcG92ZXIvcG9wb3Zlci1jb250YWluZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHVCQUF1QixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxRQUFRLEVBQWMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBd0IsTUFBTSwyQkFBMkIsQ0FBQzs7OztBQTRCaEcsTUFBTSxPQUFPLHlCQUF5QjtJQUNwQyxJQUFhLFNBQVMsQ0FBQyxLQUEyQjtRQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUU7WUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7U0FDekI7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLEdBQUcsZUFBZSxDQUFDLEtBQXFDLENBQUMsQ0FBQztTQUMxRTtJQUNILENBQUM7SUFRRCxJQUFJLFdBQVc7UUFDYixPQUFPLFFBQVEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxZQUFZLE1BQXFCO1FBTmpDLGVBQVUsR0FBeUIsS0FBSyxDQUFDO1FBT3ZDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxvQkFBb0I7UUFDbEIsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7OEdBekJVLHlCQUF5QjtrR0FBekIseUJBQXlCLG1lQy9CdEMsNk1BS0E7OzJGRDBCYSx5QkFBeUI7a0JBMUJyQyxTQUFTOytCQUNFLG1CQUFtQixtQkFDWix1QkFBdUIsQ0FBQyxNQUFNLFFBRXpDO3dCQUNKLFdBQVcsRUFBRSxXQUFXO3dCQUN4QixTQUFTLEVBQ1AsZ0pBQWdKO3dCQUNsSixjQUFjLEVBQUUsb0JBQW9CO3dCQUNwQyxhQUFhLEVBQUUsbUJBQW1CO3dCQUNsQyxJQUFJLEVBQUUsU0FBUzt3QkFDZixLQUFLLEVBQUUsa0NBQWtDO3FCQUMxQztrRkFlWSxTQUFTO3NCQUFyQixLQUFLO2dCQVFHLEtBQUs7c0JBQWIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBJbnB1dCwgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQb3BvdmVyQ29uZmlnIH0gZnJvbSAnLi9wb3BvdmVyLmNvbmZpZyc7XG5pbXBvcnQgeyBnZXRCc1ZlciwgSUJzVmVyc2lvbiB9IGZyb20gJ25neC1ib290c3RyYXAvdXRpbHMnO1xuaW1wb3J0IHsgUGxhY2VtZW50Rm9yQnM1LCBjaGVja01hcmdpbnMsIEF2YWlsYWJsZUJTUG9zaXRpb25zIH0gZnJvbSAnbmd4LWJvb3RzdHJhcC9wb3NpdGlvbmluZyc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3BvcG92ZXItY29udGFpbmVyJyxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAYW5ndWxhci1lc2xpbnQvbm8taG9zdC1tZXRhZGF0YS1wcm9wZXJ0eVxuICBob3N0OiB7XG4gICAgJ1thdHRyLmlkXSc6ICdwb3BvdmVySWQnLFxuICAgICdbY2xhc3NdJzpcbiAgICAgICdcInBvcG92ZXIgaW4gcG9wb3Zlci1cIiArIF9wbGFjZW1lbnQgKyBcIiBcIiArIFwiYnMtcG9wb3Zlci1cIiArIF9wbGFjZW1lbnQgKyBcIiBcIiArIF9wbGFjZW1lbnQgKyBcIiBcIiArIGNvbnRhaW5lckNsYXNzICsgXCIgXCIgKyBjaGVja01hcmdpbk5lY2Vzc2l0eSgpJyxcbiAgICAnW2NsYXNzLnNob3ddJzogJyFfYnNWZXJzaW9ucy5pc0JzMycsXG4gICAgJ1tjbGFzcy5iczNdJzogJ19ic1ZlcnNpb25zLmlzQnMzJyxcbiAgICByb2xlOiAndG9vbHRpcCcsXG4gICAgc3R5bGU6ICdkaXNwbGF5OmJsb2NrOyBwb3NpdGlvbjphYnNvbHV0ZSdcbiAgfSxcbiAgc3R5bGVzOiBbXG4gICAgYFxuICAgICAgOmhvc3QucG9wb3Zlci5ib3R0b20gPiAuYXJyb3cge1xuICAgICAgICBtYXJnaW4tbGVmdDogLTRweDtcbiAgICAgIH1cblxuICAgICAgOmhvc3QgLnBvcG92ZXItYXJyb3cge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICB9XG4gICAgYFxuICBdLFxuICB0ZW1wbGF0ZVVybDogJy4vcG9wb3Zlci1jb250YWluZXIuY29tcG9uZW50Lmh0bWwnXG59KVxuZXhwb3J0IGNsYXNzIFBvcG92ZXJDb250YWluZXJDb21wb25lbnQge1xuICBASW5wdXQoKSBzZXQgcGxhY2VtZW50KHZhbHVlOiBBdmFpbGFibGVCU1Bvc2l0aW9ucykge1xuICAgIGlmICghdGhpcy5fYnNWZXJzaW9ucy5pc0JzNSkge1xuICAgICAgdGhpcy5fcGxhY2VtZW50ID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3BsYWNlbWVudCA9IFBsYWNlbWVudEZvckJzNVt2YWx1ZSBhcyBrZXlvZiB0eXBlb2YgUGxhY2VtZW50Rm9yQnM1XTtcbiAgICB9XG4gIH1cblxuICBASW5wdXQoKSB0aXRsZT86IHN0cmluZztcblxuICBjb250YWluZXJDbGFzcz86IHN0cmluZztcbiAgcG9wb3ZlcklkPzogc3RyaW5nO1xuICBfcGxhY2VtZW50OiBBdmFpbGFibGVCU1Bvc2l0aW9ucyA9ICd0b3AnO1xuXG4gIGdldCBfYnNWZXJzaW9ucygpOiBJQnNWZXJzaW9uIHtcbiAgICByZXR1cm4gZ2V0QnNWZXIoKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUG9wb3ZlckNvbmZpZykge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgY29uZmlnKTtcbiAgfVxuXG4gIGNoZWNrTWFyZ2luTmVjZXNzaXR5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNoZWNrTWFyZ2lucyh0aGlzLl9wbGFjZW1lbnQpO1xuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwicG9wb3Zlci1hcnJvdyBhcnJvd1wiPjwvZGl2PlxuPGgzIGNsYXNzPVwicG9wb3Zlci10aXRsZSBwb3BvdmVyLWhlYWRlclwiICpuZ0lmPVwidGl0bGVcIj57eyB0aXRsZSB9fTwvaDM+XG48ZGl2IGNsYXNzPVwicG9wb3Zlci1jb250ZW50IHBvcG92ZXItYm9keVwiPlxuICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG48L2Rpdj5cbiJdfQ==
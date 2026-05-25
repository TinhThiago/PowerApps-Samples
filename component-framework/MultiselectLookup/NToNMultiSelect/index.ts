import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Select2 } from "select2";
import * as $ from 'jquery';
import "./scripts/select2.min.js";
import { AnyARecord } from "dns";

declare var Xrm: any;

class DataAction {
    guid: string;
    associate: boolean;
}
class NToNData {
    len: string;
    ida: string;
    na: string;
    re: string;
    rn: string;
    actions: DataAction[];
}

export class CustomNToNMultiSelect implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private contextObj: ComponentFramework.Context<IInputs>;
    private mainContainer: HTMLSelectElement;
    private errorElement: HTMLDivElement;
    private selectedItems: string[] = [];
    private overlayDiv: HTMLDivElement;
    private container: HTMLDivElement;
    private _isValidState: boolean = true;

    private _relData: NToNData;

    private _linkedEntityName: string;
    private _intersectEntityName: string;
    private __intersectEntityMainEntityLookupAttribute: string;
    private __intersectEntityRelatedEntityLookupAttribute: string;
    private _relationshipEntity: string;
    private _relationshipName: string;
    private _idAttribute: string;
    private _nameAttribute: string;
    private _linkedEntityFetchXmlResource: string;

    private _linkedEntityCollectionName: string;
    private _mainEntityCollectionName: string;
    private _intersectEntityCollectionName: string;

    private _entityMetadataSuccessCallback: any;
    private _linkedEntityMetadataSuccessCallback: any;
    private _intersectEntityMetadataSuccessCallback: any;
    private _relationshipSuccessCallback: any;
    private _successCallback: any;

    private _ctrlId: string;
    private _notifyOutputChanged: () => void;

    // Biến cờ ngăn updateView ghi đè khi người dùng thao tác click chọn
    private _isUserInteracting: boolean = false;

    /**
     * Empty constructor.
     */
    constructor() {
    }

    public S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    public newGuid() {
        var result: string = (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
        return result;
    }

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        debugger;
        this.container = container;
        this.contextObj = context;
        if (typeof Xrm == 'undefined') {
            this.errorElement = document.createElement("div");
            this.errorElement.innerHTML = "<H2>This control only works on model-driven forms!</H2>";
            container.appendChild(this.errorElement);
            this._isValidState = false;
        }
        else {
            this._ctrlId = this.newGuid();
            this._relData = new NToNData();
            this._relData.actions = [];

            if (context.parameters.intersectEntityName.raw != null) {
                this._intersectEntityName = context.parameters.intersectEntityName.raw;
                this._relData.len = this._intersectEntityName;
            }
            if (context.parameters.intersectEntityMainEntityLookupAttribute.raw != null) {
                this.__intersectEntityMainEntityLookupAttribute = context.parameters.intersectEntityMainEntityLookupAttribute.raw;
                this._relData.len = this.__intersectEntityMainEntityLookupAttribute;
            }
            if (context.parameters.intersectEntityRelatedEntityLookupAttribute.raw != null) {
                this.__intersectEntityRelatedEntityLookupAttribute = context.parameters.intersectEntityRelatedEntityLookupAttribute.raw;
                this._relData.len = this.__intersectEntityRelatedEntityLookupAttribute;
            }
            if (context.parameters.linkedEntityName.raw != null) {
                this._linkedEntityName = context.parameters.linkedEntityName.raw;
                this._relData.len = this._linkedEntityName;
            }
            if (context.parameters.idAttribute.raw != null) {
                this._idAttribute = context.parameters.idAttribute.raw;
                this._relData.ida = this._idAttribute;
            }
            if (context.parameters.nameAttribute.raw != null) {
                this._nameAttribute = context.parameters.nameAttribute.raw;
                this._relData.na = this._nameAttribute;
            }
            if (context.parameters.relationshipEntity.raw != null) {
                this._relationshipEntity = context.parameters.relationshipEntity.raw;
                this._relData.re = this._relationshipEntity;
            }
            if (context.parameters.relationshipName.raw != null) {
                this._relationshipName = context.parameters.relationshipName.raw;
                this._relData.rn = this._relationshipName;
            }
            if (context.parameters.linkedEntityFetchXmlResource.raw != null) {
                this._linkedEntityFetchXmlResource = context.parameters.linkedEntityFetchXmlResource.raw;
            }

            context.mode.trackContainerResize(true);
            container.classList.add("pcf_container_element");

            this.overlayDiv = document.createElement("div");
            this.overlayDiv.classList.add("pcf_overlay_element");
            container.appendChild(this.overlayDiv);

            this.mainContainer = document.createElement("select");
            this.mainContainer.id = this._ctrlId;
            this.mainContainer.classList.add("js-example-basic-multiple");
            this.mainContainer.classList.add("pcf_main_element");
            this.mainContainer.multiple = true;
            this.mainContainer.name = "states[]";
            container.appendChild(this.mainContainer);

            this._entityMetadataSuccessCallback = this.entityMetadataSuccessCallback.bind(this);
            this._linkedEntityMetadataSuccessCallback = this.linkedEntityMetadataSuccessCallback.bind(this);
            this._intersectEntityMetadataSuccessCallback = this.intersectEntityMetadataSuccessCallback.bind(this);
            this._relationshipSuccessCallback = this.relationshipSuccessCallback.bind(this);
            this._successCallback = this.successCallback.bind(this);

            this._notifyOutputChanged = notifyOutputChanged;

            (<any>Xrm).Utility.getEntityMetadata((<any>this.contextObj).page.entityTypeName, []).then(this._entityMetadataSuccessCallback, this.errorCallback);
            (<any>Xrm).Utility.getEntityMetadata(this._linkedEntityName, []).then(this._linkedEntityMetadataSuccessCallback, this.errorCallback);
            (<any>Xrm).Utility.getEntityMetadata(this._intersectEntityName, []).then(this._intersectEntityMetadataSuccessCallback, this.errorCallback);

            if ((<any>this.contextObj).page.entityId != null && (<any>this.contextObj).page.entityId != "00000000-0000-0000-0000-000000000000") {
                this.contextObj.webAPI.retrieveRecord(
                    (<any>this.contextObj).page.entityTypeName,
                    (<any>this.contextObj).page.entityId,
                    `?$select=${(<any>this.contextObj).page.entityTypeName}id&$expand=${this._relationshipName}($select=${this._idAttribute})`
                ).then(
                    (result: any) => {
                        let mockValue = { entities: result[this._relationshipName] || [] };
                        this.relationshipSuccessCallback(mockValue);
                    },
                    this.errorCallback
                );
            } else {
                this.relationshipSuccessCallback(null);
            }

            var thisVar: any;
            thisVar = this;
            $(document).ready(function () {
                thisVar.setReadonly();
                $('#' + thisVar._ctrlId).select2().on('select2:select', function (e) {
                    var data = e.params.data;
                    thisVar.selectAction("select", data.id);
                }).on('select2:unselect', function (e) {
                    var data = e.params.data;
                    thisVar.selectAction("unselect", data.id);
                });
            });

            // SỬA: Lấy từ thuộc tính 'value' gốc của Manifest để đồng nhất kiểu dữ liệu
            var rawPropertyValue = context.parameters.value ? context.parameters.value.raw : null;
            if (rawPropertyValue) {
                try {
                    var parsedData = JSON.parse(rawPropertyValue);
                    if (parsedData && parsedData.actions) {
                        this._relData.actions = parsedData.actions;
                    }
                } catch (e) {
                    console.log("Lỗi parse JSON tại init: ", e);
                    this._relData.actions = [];
                }
            } else {
                this._relData.actions = [];
            }
        }
    }

    public entityMetadataSuccessCallback(value: any): void | PromiseLike<void> {
        this._mainEntityCollectionName = value.EntitySetName;
    }

    public linkedEntityMetadataSuccessCallback(value: any): void | PromiseLike<void> {
        this._linkedEntityCollectionName = value.EntitySetName;
    }

    public intersectEntityMetadataSuccessCallback(value: any): void | PromiseLike<void> {
        this._intersectEntityCollectionName = value.EntitySetName;
    }

    public addOptions(value: any) {
        for (var i in value.entities) {
            var current: any = value.entities[i];
            var checked = this.selectedItems.indexOf(<string>current[this._idAttribute]) > -1;
            var newOption = new Option(current[this._nameAttribute], current[this._idAttribute], checked, checked);
            $('#' + this._ctrlId).append(newOption);
        }
    }

    public successCallback(value: any): void | PromiseLike<void> {
        this.addOptions(value);
    }

    public relationshipSuccessCallback(value: any): void | PromiseLike<void> {
        if (value != null && value.entities != null) {
            for (var i in value.entities) {
                this.selectedItems.push(value.entities[i][this._idAttribute]);
            }
        }
        if (this._linkedEntityFetchXmlResource != null) {
            var _self = this;
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    _self.contextObj.webAPI.retrieveMultipleRecords(_self._linkedEntityName, "?fetchXml=" + encodeURIComponent(this.responseText), 5000).then(_self._successCallback, _self.errorCallback);
                }
            };
            xhttp.open("GET", this._linkedEntityFetchXmlResource, true);
            xhttp.send();
        }
        else {
            this.contextObj.webAPI.retrieveMultipleRecords(this._linkedEntityName, "?$orderby=" + this._nameAttribute + " asc", 5000).then(this._successCallback, this.errorCallback);
        }
    }

    public errorCallback(value: any) {
        alert(value);
    }

    public setReadonly(): void {
        (<HTMLElement>this.container.firstElementChild).style.display = this.contextObj.mode.isControlDisabled == false ? "none" : "block";
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (this._isValidState == false) return;
        this.contextObj = context;
        this.setReadonly();

        // Nếu người dùng đang tự bấm chọn trên màn hình, không cho ghi đè dữ liệu
        if (this._isUserInteracting) {
            return;
        }

        // SỬA: Lấy từ thuộc tính 'value' gốc để tránh lỗi biên dịch TypeScript
        var rawPropertyValue = context.parameters.value ? context.parameters.value.raw : null;
        if (rawPropertyValue) {
            try {
                var parsedData = JSON.parse(rawPropertyValue);
                if (parsedData && parsedData.actions) {
                    this._relData.actions = parsedData.actions;
                }
            } catch (e) {
                console.log("Lỗi parse JSON tại updateView: ", e);
                this._relData.actions = [];
            }
        } else {
            this._relData.actions = [];
        }
    }

    public getOutputs(): IOutputs {
        if (this._isValidState == false) {
            return { value: undefined };
        }

        // SỬA: Trả ra đúng tên thuộc tính 'value' được định nghĩa trong IOutputs
        if (!this._relData || !this._relData.actions || this._relData.actions.length === 0) {
            return {
                value: undefined
            };
        }

        return {
            value: JSON.stringify(this._relData)
        };
    }

    public destroy(): void {
    }

    public selectAction(action: string, id: string) {
        if (!id) return;

        this._isUserInteracting = true;
        const cleanId = id.toLowerCase().replace(/[{}]/g, "");

        if (!this._relData.actions) {
            this._relData.actions = [];
        }

        if (action == "select") {
            var exists = this._relData.actions.some(act => act.guid && act.guid.toLowerCase().replace(/[{}]/g, "") === cleanId);
            if (!exists) {
                var act = new DataAction();
                act.associate = true;
                act.guid = cleanId;
                this._relData.actions.push(act);
            }
        }
        else if (action == "unselect") {
            this._relData.actions = this._relData.actions.filter(act => act.guid && act.guid.toLowerCase().replace(/[{}]/g, "") !== cleanId);
        }

        this._notifyOutputChanged();

        setTimeout(() => {
            this._isUserInteracting = false;
        }, 300);

        if ((<any>this.contextObj).page.entityId != null
            && (<any>this.contextObj).page.entityId != "00000000-0000-0000-0000-000000000000") {
            var url: string = (<any>Xrm).Utility.getGlobalContext().getClientUrl();
            var associateUrl: string = url + "/api/data/v9.1/" + this._mainEntityCollectionName + "(" + (<any>this.contextObj).page.entityId + ")/" + this._relationshipName + "/$ref";

            if (action == "select") {
                const payload = {
                    "@odata.id": url + "/api/data/v9.1/" + this._linkedEntityCollectionName + "(" + id + ")"
                };

                var req = new XMLHttpRequest();
                req.open("POST", associateUrl, true);
                req.setRequestHeader("Accept", "application/json");
                req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                req.setRequestHeader("OData-MaxVersion", "4.0");
                req.setRequestHeader("OData-Version", "4.0");
                req.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        req.onreadystatechange = null;
                        if (this.status != 204) {
                            var error = JSON.parse(this.response).error;
                            alert("Lỗi kết hợp: " + error.message);
                        }
                    }
                };
                req.send(JSON.stringify(payload));
            }
            else if (action == "unselect") {
                var disassociateUrl = associateUrl + "?$id=" + url + "/api/data/v9.1/" + this._linkedEntityCollectionName + "(" + id + ")";

                var req = new XMLHttpRequest();
                req.open("DELETE", disassociateUrl, true);
                req.setRequestHeader("Accept", "application/json");
                req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                req.setRequestHeader("OData-MaxVersion", "4.0");
                req.setRequestHeader("OData-Version", "4.0");
                req.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        req.onreadystatechange = null;
                        if (this.status != 204) {
                            var error = JSON.parse(this.response).error;
                            alert("Lỗi hủy kết hợp: " + error.message);
                        }
                    }
                };
                req.send();
            }
        }
    }
}
import {watch} from 'vue'
import {acceptHMRUpdate, defineStore} from 'pinia'
import qs from 'qs'
import {vaah} from '../vaahvue/pinia/vaah'

let model_namespace = 'VaahCms\\Modules\\Basic\\Models\\Order';


let base_url = document.getElementsByTagName('base')[0].getAttribute("href");
let ajax_url = base_url + "/basic/orders";

let empty_states = {
    query: {
        page: null,
        rows: null,
        filter: {
            q: null,
            is_active: null,
            trashed: null,
            sort: null,
        },
    },
    action: {
        type: null,
        items: [],
        status: null
    }
};

export const useOrderStore = defineStore({
        id: 'orders',
        state: () => ({
            base_url: base_url,
            ajax_url: ajax_url,
            model: model_namespace,
            assets_is_fetching: true,
            app: null,
            assets: null,
            rows_per_page: [10, 20, 30, 50, 100, 500],
            list: null,
            item: null,
            fillable: null,
            empty_query: empty_states.query,
            empty_action: empty_states.action,
            query: vaah().clone(empty_states.query),
            action: vaah().clone(empty_states.action),
            search: {
                delay_time: 600, // time delay in milliseconds
                delay_timer: 0 // time delay in milliseconds
            },
            route: null,
            watch_stopper: null,
            route_prefix: 'orders.',
            view: 'large',
            show_filters: false,
            list_view_width: 12,
            form: {
                type: 'Create',
                action: null,
                is_button_loading: null
            },
            is_list_loading: null,
            count_filters: 0,
            list_selected_menu: [],
            list_bulk_menu: [],
            list_create_menu: [],
            item_menu_list: [],
            item_menu_state: null,
            changeOrderStatusText:null,
            form_menu_list: [],
            show_change_status_dropdown:false,
            order_status: [
                {name: 'In stock', slug: 'in-stock'},
                {name: 'A few left', slug: 'a-few-left'},
                {name: 'Out of stock', slug: 'out-of-stock'}
            ]
        }),
        getters: {},
        actions: {
            //---------------------------------------------------------------------
            async onLoad(route) {
                /**
                 * Set initial routes
                 */
                this.route = route;

                /**
                 * Update with view and list css column number
                 */
                this.setViewAndWidth(route.name);

                /**
                 * Update query state with the query parameters of url
                 */
                this.updateQueryFromUrl(route);
            }
            ,
            //---------------------------------------------------------------------
            setViewAndWidth(route_name) {
                switch (route_name) {
                    case 'orders.index':
                        this.view = 'large';
                        this.list_view_width = 12;
                        break;
                    default:
                        this.view = 'small';
                        this.list_view_width = 6;
                        break
                }
            }
            ,
            //---------------------------------------------------------------------
            async updateQueryFromUrl(route) {
                if (route.query) {
                    if (Object.keys(route.query).length > 0) {
                        for (let key in route.query) {
                            this.query[key] = route.query[key]
                        }
                        this.countFilters(route.query);
                    }
                }
            }
            ,
            //---------------------------------------------------------------------
            watchRoutes(route) {
                //watch routes
                this.watch_stopper = watch(route, (newVal, oldVal) => {

                        if (this.watch_stopper && !newVal.name.includes(this.route_prefix)) {
                            this.watch_stopper();

                            return false;
                        }

                        this.route = newVal;

                        if (newVal.params.id) {
                            this.getItem(newVal.params.id);
                        }

                        this.setViewAndWidth(newVal.name);

                    }, {deep: true}
                )
            }
            ,
            //---------------------------------------------------------------------
            watchStates() {
                watch(this.query.filter, (newVal, oldVal) => {
                        this.delayedSearch();
                    }, {deep: true}
                )
            }
            ,
            //---------------------------------------------------------------------
            watchItem(name) {
                if (name && name !== "") {
                    this.item.name = vaah().capitalising(name);
                    this.item.slug = vaah().strToSlug(name);
                }
            },
            //---------------------------------------------------------------------
            watchAmount(amount) {
                if (amount || amount.value !== null) {
                    this.item.total_amount = this.calculateTotal(amount.value);
                    this.item.tax = this.calculateTax(amount.value);
                }
                return null;
            },
            //---------------------------------------------------------------------
            async watchTotalAmount(total) {
                if (total.value !== this.item.amount) {
                    this.item.total_amount = total.value;
                    this.item.amount = await this.calculateAmount(this.item.total_amount);
                }
            },
            //---------------------------------------------------------------------
            async getAssets() {

                if (this.assets_is_fetching === true) {
                    this.assets_is_fetching = false;

                    await vaah().ajax(
                        this.ajax_url + '/assets',
                        this.afterGetAssets,
                    );
                }
            }
            ,
            //---------------------------------------------------------------------
            afterGetAssets(data, res) {
                if (data) {
                    this.assets = data;
                    if (data.rows) {
                        this.query.rows = data.rows;
                    }

                    if (this.route.params && !this.route.params.id) {
                        this.item = vaah().clone(data.empty_item);
                    }

                }
            }
            ,
            //---------------------------------------------------------------------
            async getList() {
                let options = {
                    query: vaah().clone(this.query)
                };
                await vaah().ajax(
                    this.ajax_url,
                    this.afterGetList,
                    options
                );
            }
            ,
            //---------------------------------------------------------------------
            afterGetList: function (data, res) {
                if (data) {
                    this.list = data;
                }
            }
            ,
            //---------------------------------------------------------------------

            async getItem(id) {
                if (id) {
                    await vaah().ajax(
                        ajax_url + '/' + id,
                        this.getItemAfter
                    );
                }
            }
            ,
            //---------------------------------------------------------------------
            async getItemAfter(data, res) {
                if (data) {
                    this.item = data;
                } else {
                    this.$router.push({name: 'orders.index'});
                }
                await this.getItemMenu();
                await this.getFormMenu();
            }
            ,
            //---------------------------------------------------------------------
            isListActionValid() {

                if (!this.action.type) {
                    vaah().toastErrors(['Select an action type']);
                    return false;
                }

                if (this.action.items.length < 1) {
                    vaah().toastErrors(['Select records']);
                    return false;
                }

                return true;
            }
            ,
            //---------------------------------------------------------------------
            async updateList(type = null) {

                if (!type && this.action.type) {
                    type = this.action.type;
                } else {
                    this.action.type = type;
                }

                if (!this.isListActionValid()) {
                    this.show_change_status_dropdown = false;
                    return false;

                }


                let method = 'PUT';

                switch (type) {
                    case 'delete':
                        method = 'DELETE';
                        break;
                }

                let options = {
                    params: this.action,
                    method: method,
                    show_success: false
                };
                await vaah().ajax(
                    this.ajax_url,
                    this.updateListAfter,
                    options
                );
            }
            ,
            //---------------------------------------------------------------------
            async updateListAfter(data, res) {
                if (data) {
                    this.action = vaah().clone(this.empty_action);
                    await this.getList();
                }
            }
            ,
            //---------------------------------------------------------------------
            async listAction(type = null) {

                if (!type && this.action.type) {
                    type = this.action.type;
                } else {
                    this.action.type = type;
                }

                let url = this.ajax_url + '/action/' + type
                let method = 'PUT';

                switch (type) {
                    case 'delete':
                        url = this.ajax_url
                        method = 'DELETE';
                        break;
                    case 'delete-all':
                        method = 'DELETE';
                        break;
                }

                this.action.filter = this.query.filter;

                let options = {
                    params: this.action,
                    method: method,
                    show_success: false
                };
                await vaah().ajax(
                    url,
                    this.updateListAfter,
                    options
                );
            }
            ,
            //---------------------------------------------------------------------
            async itemAction(type, item = null) {
                if (!item) {
                    item = this.item;
                }

                this.form.action = type;

                let ajax_url = this.ajax_url;

                let options = {
                    method: 'post',
                };

                /**
                 * Learn more about http request methods at
                 * https://www.youtube.com/watch?v=tkfVQK6UxDI
                 */
                switch (type) {
                    /**
                     * Create a record, hence method is `POST`
                     * https://docs.vaah.dev/guide/laravel.html#create-one-or-many-records
                     */
                    case 'create-and-new':
                    case 'create-and-close':
                    case 'create-and-clone':
                        options.method = 'POST';
                        options.params = item;
                        break;

                    /**
                     * Update a record with many columns, hence method is `PUT`
                     * https://docs.vaah.dev/guide/laravel.html#update-a-record-update-soft-delete-status-change-etc
                     */
                    case 'save':
                    case 'save-and-close':
                    case 'save-and-clone':
                        options.method = 'PUT';
                        options.params = item;
                        ajax_url += '/' + item.id
                        break;
                    /**
                     * Delete a record, hence method is `DELETE`
                     * and no need to send entire `item` object
                     * https://docs.vaah.dev/guide/laravel.html#delete-a-record-hard-deleted
                     */
                    case 'delete':
                        options.method = 'DELETE';
                        ajax_url += '/' + item.id
                        break;
                    /**
                     * Update a record's one column or very few columns,
                     * hence the method is `PATCH`
                     * https://docs.vaah.dev/guide/laravel.html#update-a-record-update-soft-delete-status-change-etc
                     */
                    default:
                        options.method = 'PATCH';
                        ajax_url += '/' + item.id + '/action/' + type;
                        break;
                }

                await vaah().ajax(
                    ajax_url,
                    this.itemActionAfter,
                    options
                );
            }
            ,
            //---------------------------------------------------------------------
            async itemActionAfter(data, res) {
                if (data) {
                    await this.getList();
                    await this.formActionAfter(data);
                    this.getItemMenu();
                    this.getFormMenu();
                }
            }
            ,
            //---------------------------------------------------------------------
            async formActionAfter(data) {
                switch (this.form.action) {
                    case 'create-and-new':
                    case 'save-and-new':
                        this.setActiveItemAsEmpty();
                        break;
                    case 'create-and-close':
                    case 'save-and-close':
                        this.setActiveItemAsEmpty();
                        this.$router.push({name: 'orders.index'});
                        break;
                    case 'save-and-clone':
                    case 'create-and-clone':
                        this.item.id = null;
                        await this.getFormMenu();
                        break;
                    case 'trash':
                    case 'restore':
                    case 'save':
                        this.item = data;
                        break;
                    case 'delete':
                        this.item = null;
                        this.toList();
                        break;
                }
            }
            ,
            //---------------------------------------------------------------------
            async toggleIsActive(item) {
                if (item.is_active) {
                    await this.itemAction('activate', item);
                } else {
                    await this.itemAction('deactivate', item);
                }
            },
            //---------------------------------------------------------------------
            async changeStatus(item){
                let query = {
                    id:item.id,
                    status:item.status
                }
                let method = 'PUT';
                let options = {
                    params: query,
                    method: method
                };
                let url = this.ajax_url + '/change-status';
                await vaah().ajax(
                    url,
                    this.afterChangeStatus,
                    options
                );
            },
            //---------------------------------------------------------------------
            afterChangeStatus(){

            },
            //---------------------------------------------------------------------
            async paginate(event) {
                this.query.page = event.page + 1;
                await this.getList();
                await this.updateUrlQueryString(this.query);
            }
            ,
            //---------------------------------------------------------------------
            async reload() {
                await this.getAssets();
                await this.getList();
            }
            ,
            //---------------------------------------------------------------------
            async getFormInputs() {
                let params = {
                    model_namespace: this.model,
                    except: this.assets.fillable.except,
                };

                let url = this.ajax_url + '/fill';

                await vaah().ajax(
                    url,
                    this.getFormInputsAfter,
                );
            }
            ,
            //---------------------------------------------------------------------
            getFormInputsAfter: function (data, res) {
                if (data) {
                    let self = this;
                    Object.keys(data.fill).forEach(function (key) {
                        self.item[key] = data.fill[key];
                    });
                }
            }
            ,

            //---------------------------------------------------------------------

            //---------------------------------------------------------------------
            onItemSelection(items) {
                this.action.items = items;
            }
            ,
            //---------------------------------------------------------------------
            setActiveItemAsEmpty() {
                this.item = vaah().clone(this.assets.empty_item);
            }
            ,
            //---------------------------------------------------------------------
            confirmDelete() {
                if (this.action.items.length < 1) {
                    vaah().toastErrors(['Select a record']);
                    return false;
                }
                this.action.type = 'delete';
                vaah().confirmDialogDelete(this.listAction);
            }
            ,
            //---------------------------------------------------------------------
            confirmDeleteAll() {
                this.action.type = 'delete-all';
                vaah().confirmDialogDelete(this.listAction);
            }
            ,
            //---------------------------------------------------------------------
            async delayedSearch() {
                let self = this;
                this.query.page = 1;
                this.action.items = [];
                clearTimeout(this.search.delay_timer);
                this.search.delay_timer = setTimeout(async function () {
                    await self.updateUrlQueryString(self.query);
                    await self.getList();
                }, this.search.delay_time);
            }
            ,
            //---------------------------------------------------------------------
            async updateUrlQueryString(query) {
                //remove reactivity from source object
                query = vaah().clone(query)

                //create query string
                let query_string = qs.stringify(query, {
                    skipNulls: true,
                });
                let query_object = qs.parse(query_string);

                if (query_object.filter) {
                    query_object.filter = vaah().cleanObject(query_object.filter);
                }

                //reset url query string
                await this.$router.replace({query: null});

                //replace url query string
                await this.$router.replace({query: query_object});

                //update applied filters
                this.countFilters(query_object);

            }
            ,
            //---------------------------------------------------------------------
            countFilters: function (query) {
                this.count_filters = 0;
                if (query && query.filter) {
                    let filter = vaah().cleanObject(query.filter);
                    this.count_filters = Object.keys(filter).length;
                }
            }
            ,
            //---------------------------------------------------------------------
            async clearSearch() {
                this.query.filter.q = null;
                await this.updateUrlQueryString(this.query);
                await this.getList();
            }
            ,
            //---------------------------------------------------------------------
            async resetQuery() {
                //reset query strings
                await this.resetQueryString();

                //reload page list
                await this.getList();
            }
            ,
            //---------------------------------------------------------------------
            async resetQueryString() {
                for (let key in this.query.filter) {
                    this.query.filter[key] = null;
                }
                await this.updateUrlQueryString(this.query);
            }
            ,
            //---------------------------------------------------------------------
            closeForm() {
                this.$router.push({name: 'orders.index'})
            }
            ,
            //---------------------------------------------------------------------
            toList() {
                this.item = vaah().clone(this.assets.empty_item);
                this.$router.push({name: 'orders.index'})
            }
            ,
            //---------------------------------------------------------------------
            toForm() {
                this.item = vaah().clone(this.assets.empty_item);
                this.getFormMenu();
                this.$router.push({name: 'orders.form'})
            }
            ,
            //---------------------------------------------------------------------
            toView(item) {
                this.item = vaah().clone(item);
                this.$router.push({name: 'orders.view', params: {id: item.id}})
            }
            ,
            //---------------------------------------------------------------------
            toEdit(item) {
                this.item = item;
                this.$router.push({name: 'orders.form', params: {id: item.id}})
            }
            ,
            //---------------------------------------------------------------------
            isViewLarge() {
                return this.view === 'large';
            }
            ,
            //---------------------------------------------------------------------
            getIdWidth() {
                let width = 50;

                if (this.list && this.list.total) {
                    let chrs = this.list.total.toString();
                    chrs = chrs.length;
                    width = chrs * 40;
                }

                return width + 'px';
            }
            ,
            //---------------------------------------------------------------------
            getActionWidth() {
                let width = 100;
                if (!this.isViewLarge()) {
                    width = 80;
                }
                return width + 'px';
            }
            ,
            //---------------------------------------------------------------------
            getActionLabel() {
                let text = null;
                if (this.isViewLarge()) {
                    text = 'Actions';
                }

                return text;
            }
            ,
            //---------------------------------------------------------------------
            async getListSelectedMenu() {
                this.list_selected_menu = [
                    {
                        label: 'Activate',
                        command: async () => {
                            await this.updateList('activate')
                        }
                    },
                    {
                        label: 'Deactivate',
                        command: async () => {
                            await this.updateList('deactivate')
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Change Status',
                        icon: 'pi pi-sync',
                        command: async () => {
                            this.show_change_status_dropdown = true;
                            this.toggleChangeStatus()
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Trash',
                        icon: 'pi pi-times',
                        command: async () => {
                            await this.updateList('trash')
                        }
                    },
                    {
                        label: 'Restore',
                        icon: 'pi pi-replay',
                        command: async () => {
                            await this.updateList('restore')
                        }
                    },
                    {
                        label: 'Delete',
                        icon: 'pi pi-trash',
                        command: () => {
                            this.confirmDelete()
                        }
                    },
                ]

            }
            ,
            //---------------------------------------------------------------------
            getListBulkMenu() {
                this.list_bulk_menu = [
                    {
                        label: 'Mark all as active',
                        command: async () => {
                            await this.listAction('activate-all')
                        }
                    },
                    {
                        label: 'Mark all as inactive',
                        command: async () => {
                            await this.listAction('deactivate-all')
                        }
                    },
                    {
                        separator: true
                    },
                    {
                        label: 'Trash All',
                        icon: 'pi pi-times',
                        command: async () => {
                            await this.listAction('trash-all')
                        }
                    },
                    {
                        label: 'Restore All',
                        icon: 'pi pi-replay',
                        command: async () => {
                            await this.listAction('restore-all')
                        }
                    },
                    {
                        label: 'Delete All',
                        icon: 'pi pi-trash',
                        command: async () => {
                            this.confirmDeleteAll();
                        }
                    },
                ];
            }
            ,
            //---------------------------------------------------------------------
            getItemMenu() {
                let item_menu = [];

                if (this.item && this.item.deleted_at) {

                    item_menu.push({
                        label: 'Restore',
                        icon: 'pi pi-refresh',
                        command: () => {
                            this.itemAction('restore');
                        }
                    });
                }

                if (this.item && this.item.id && !this.item.deleted_at) {
                    item_menu.push({
                        label: 'Trash',
                        icon: 'pi pi-times',
                        command: () => {
                            this.itemAction('trash');
                        }
                    });
                }

                item_menu.push({
                    label: 'Delete',
                    icon: 'pi pi-trash',
                    command: () => {
                        this.confirmDeleteItem('delete');
                    }
                });

                this.item_menu_list = item_menu;
            }
            ,
            //---------------------------------------------------------------------
            async getListCreateMenu() {
                let form_menu = [];

                form_menu.push(
                    {
                        label: 'Create 100 Records',
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.listAction('create-100-records');
                        }
                    },
                    {
                        label: 'Create 1000 Records',
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.listAction('create-1000-records');
                        }
                    },
                    {
                        label: 'Create 5000 Records',
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.listAction('create-5000-records');
                        }
                    },
                    {
                        label: 'Create 10,000 Records',
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.listAction('create-10000-records');
                        }
                    },
                )

                this.list_create_menu = form_menu;

            }
            ,

            //---------------------------------------------------------------------
            confirmDeleteItem() {
                this.form.type = 'delete';
                vaah().confirmDialogDelete(this.confirmDeleteItemAfter);
            }
            ,
            //---------------------------------------------------------------------
            confirmDeleteItemAfter() {
                this.itemAction('delete', this.item);
            }
            ,
            //---------------------------------------------------------------------
            async getFormMenu() {
                let form_menu = [];

                if (this.item && this.item.id) {
                    let is_deleted = !!this.item.deleted_at;
                    form_menu = [
                        {
                            label: 'Save & Close',
                            icon: 'pi pi-check',
                            command: () => {

                                this.itemAction('save-and-close');
                            }
                        },
                        {
                            label: 'Save & Clone',
                            icon: 'pi pi-copy',
                            command: () => {

                                this.itemAction('save-and-clone');

                            }
                        },
                        {
                            label: is_deleted ? 'Restore' : 'Trash',
                            icon: is_deleted ? 'pi pi-refresh' : 'pi pi-times',
                            command: () => {
                                this.itemAction(is_deleted ? 'restore' : 'trash');
                            }
                        },
                        {
                            label: 'Delete',
                            icon: 'pi pi-trash',
                            command: () => {
                                this.confirmDeleteItem('delete');
                            }
                        },
                    ];

                } else {
                    form_menu = [
                        {
                            label: 'Create & Close',
                            icon: 'pi pi-check',
                            command: () => {
                                this.itemAction('create-and-close');
                            }
                        },
                        {
                            label: 'Create & Clone',
                            icon: 'pi pi-copy',
                            command: () => {

                                this.itemAction('create-and-clone');

                            }
                        },
                        {
                            label: 'Reset',
                            icon: 'pi pi-refresh',
                            command: () => {
                                this.setActiveItemAsEmpty();
                            }
                        }
                    ];
                }

                form_menu.push({
                    label: 'Fill',
                    icon: 'pi pi-pencil',
                    command: () => {
                        this.getFormInputs();
                    }
                },)

                this.form_menu_list = form_menu;

            },
            //---------------------------------------------------------------------
            calculateTax(amount) {
                if (amount !== null) {
                    let tax = null;
                    tax = (amount * 10) / 100;
                    return parseFloat(tax.toFixed(4));
                }
                return null;
            },
            //---------------------------------------------------------------------
            calculateTotal(amount) {
                if (amount !== null) {
                    let calculated_amount = null;
                    calculated_amount = parseFloat(amount) + (amount * 10) / 100;
                    return parseFloat(calculated_amount.toFixed(4))
                }
                return null;
            },
            //---------------------------------------------------------------------
            async calculateAmount(total_amount) {
                if (total_amount !== null) {
                    let calculated_amount = total_amount/1.1;
                    return parseFloat(calculated_amount.toFixed(4));
                }
            },
            //---------------------------------------------------------------------
            toggleChangeStatus(){
                if (this.action.items.length < 1) {
                    vaah().toastErrors(['Select records']);
                    this.show_change_status_dropdown = false;
                    return false;
                }
            },
            bulkChangeStatus(status){
            console.log(this.action.items,status);
                let query = {
                    items:this.action.items,
                    status:status.value
                }
                let method = 'PUT';
                let options = {
                    params: query,
                    method: method
                };
                let url = this.ajax_url + '/bulk-change-status';
                 vaah().ajax(
                    url,
                    this.afterBulkChangeStatus,
                    options
                );

            },
            //---------------------------------------------------------------------
            async afterBulkChangeStatus(data){
                if(data){
                    this.show_change_status_dropdown=false;
                    this.action = vaah().clone(this.empty_action);
                    await this.getList();
                }
            }
            //---------------------------------------------------------------------
        }
    })
;


// Pinia hot reload
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useOrderStore, import.meta.hot))
}

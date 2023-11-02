<script setup>
import {vaah} from '../../../vaahvue/pinia/vaah'
import {useOrderStore} from '../../../stores/store-orders'

const store = useOrderStore();
const useVaah = vaah();

function getSeverity(product) {
    switch (product.status) {
        case 'In Stock':
            return 'success';

        case 'A few left':
            return 'warning';

        case 'Out of stock':
            return 'danger';

        default:
            return null;
    }
}

</script>

<template>

    <div v-if="store.list">
        <!--table-->
        <DataTable :value="store.list.data"
                   dataKey="id"
                   class="p-datatable-sm p-datatable-hoverable-rows"
                   v-model:selection="store.action.items"
                   stripedRows
                   responsiveLayout="scroll">

            <Column selectionMode="multiple"
                    v-if="store.isViewLarge()"
                    headerStyle="width: 3em">
            </Column>

            <Column field="id" header="ID" :style="{width: store.getIdWidth()}" :sortable="true">
            </Column>

            <Column field="name" header="Name"
                    :sortable="true">

                <template #body="prop">
                    <Badge v-if="prop.data.deleted_at"
                           value="Trashed"
                           severity="danger"></Badge>
                    {{ prop.data.name }}
                </template>

            </Column>


            <Column field="status" header="Status"
                    style="width:150px; padding-left:1rem;"
                    :sortable="true">

                <template #body="slotProps">
                    <Tag :value="slotProps.data.status"
                         class="p-tag"
                         :severity="getSeverity(slotProps.data)"/>
                </template>

            </Column>


            <Column field="amount" header="Amount"
                    style="width:150px;"
                    :class="'text-left'"
                    :sortable="true">

                <template #body="props">
                    &#8377 {{ props.data.amount }}
                </template>

            </Column>


            <Column field="tax" header="Tax"
                    v-if="store.isViewLarge()"
                    style="width:150px;"
                    :sortable="true">

                <template #body="props">
                    &#8377 {{ props.data.tax }}
                </template>

            </Column>

            <Column field="total_amount" header="Total Amount"
                    v-if="store.isViewLarge()"
                    style="width:150px;"
                    :sortable="true">

                <template #body="props">
                    &#8377 {{ props.data.total_amount }}
                </template>

            </Column>

            <Column field="is_active" v-if="store.isViewLarge()"
                    style="width:100px;"
                    header="Is Active">
                <template #body="prop">
                    <InputSwitch v-model.bool="prop.data.is_active"
                                 data-testid="orders-table-is-active"
                                 v-bind:false-value="0" v-bind:true-value="1"
                                 class="p-inputswitch-sm"
                                 @input="store.toggleIsActive(prop.data)">
                    </InputSwitch>
                </template>

            </Column>

            <Column field="actions" style="width:150px;"
                    :style="{width: store.getActionWidth() }"
                    :header="store.getActionLabel()">

                <template #body="prop">
                    <div class="p-inputgroup ">

                        <Button class="p-button-tiny p-button-text"
                                data-testid="orders-table-to-view"
                                :disabled="store.item && store.item.id === prop.data.id"
                                v-tooltip.top="'View'"
                                @click="store.toView(prop.data)"
                                icon="pi pi-eye"/>

                        <Button class="p-button-tiny p-button-text"
                                data-testid="orders-table-to-edit"
                                :disabled="store.item && store.item.id === prop.data.id"
                                v-tooltip.top="'Update'"
                                @click="store.toEdit(prop.data)"
                                icon="pi pi-pencil"/>

                        <Button class="p-button-tiny p-button-danger p-button-text"
                                data-testid="orders-table-action-trash"
                                v-if="store.isViewLarge() && !prop.data.deleted_at"
                                @click="store.itemAction('trash', prop.data)"
                                v-tooltip.top="'Trash'"
                                icon="pi pi-trash"/>


                        <Button class="p-button-tiny p-button-success p-button-text"
                                data-testid="orders-table-action-restore"
                                v-if="store.isViewLarge() && prop.data.deleted_at"
                                @click="store.itemAction('restore', prop.data)"
                                v-tooltip.top="'Restore'"
                                icon="pi pi-replay"/>


                    </div>

                </template>


            </Column>


        </DataTable>
        <!--/table-->

        <!--paginator-->
        <Paginator v-model:rows="store.query.rows"
                   :totalRecords="store.list.total"
                   :first="(store.query.page-1)*store.query.rows"
                   @page="store.paginate($event)"
                   :rowsPerPageOptions="store.rows_per_page"
                   class="bg-white-alpha-0 pt-2">
        </Paginator>
        <!--/paginator-->

    </div>

</template>

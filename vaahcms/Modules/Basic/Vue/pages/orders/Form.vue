<script setup>
import {onMounted, ref, watchEffect} from "vue";
import {useOrderStore} from '../../stores/store-orders'

import VhField from './../../vaahvue/vue-three/primeflex/VhField.vue'
import {useRoute} from 'vue-router';


const store = useOrderStore();
const route = useRoute();

onMounted(async () => {
    if (route.params && route.params.id) {
        await store.getItem(route.params.id);
    }

    await store.getFormMenu();
});

watchEffect(()=>{
    if (store.item && store.item.amount) {
        store.item.tax = store.calculateTax(store.item.amount);
    }
})

//--------form_menu
const form_menu = ref();
const toggleFormMenu = (event) => {
    form_menu.value.toggle(event);
};
//--------/form_menu

</script>
<template>

    <div class="col-6">

        <Panel class="is-small">

            <template class="p-1" #header>


                <div class="flex flex-row">
                    <div class="p-panel-title">
                        <span v-if="store.item && store.item.id">
                            Update
                        </span>
                        <span v-else>
                            Create
                        </span>
                    </div>

                </div>


            </template>

            <template #icons>


                <div class="p-inputgroup">

                    <Button class="p-button-sm"
                            v-if="store.item && store.item.id"
                            data-testid="orders-view_item"
                            @click="store.toView(store.item)"
                            icon="pi pi-eye"/>

                    <Button label="Save"
                            class="p-button-sm"
                            v-if="store.item && store.item.id"
                            data-testid="orders-save"
                            @click="store.itemAction('save')"
                            icon="pi pi-save"/>

                    <Button label="Create & New"
                            v-else
                            @click="store.itemAction('create-and-new')"
                            class="p-button-sm"
                            data-testid="orders-create-and-new"
                            icon="pi pi-save"/>


                    <!--form_menu-->
                    <Button
                        type="button"
                        @click="toggleFormMenu"
                        class="p-button-sm"
                        data-testid="orders-form-menu"
                        icon="pi pi-angle-down"
                        aria-haspopup="true"/>

                    <Menu ref="form_menu"
                          :model="store.form_menu_list"
                          :popup="true"/>
                    <!--/form_menu-->


                    <Button class="p-button-primary p-button-sm"
                            icon="pi pi-times"
                            data-testid="orders-to-list"
                            @click="store.toList()">
                    </Button>
                </div>


            </template>


            <div v-if="store.item" class="mt-2">

                <Message severity="error"
                         class="p-container-message mb-3"
                         :closable="false"
                         icon="pi pi-trash"
                         v-if="store.item.deleted_at">

                    <div class="flex align-items-center justify-content-between">

                        <div class="">
                            Deleted {{ store.item.deleted_at }}
                        </div>

                        <div class="ml-3">
                            <Button label="Restore"
                                    class="p-button-sm"
                                    data-testid="articles-item-restore"
                                    @click="store.itemAction('restore')">
                            </Button>
                        </div>

                    </div>

                </Message>


                <VhField label="Name">
                    <InputText class="w-full"
                               name="orders-name"
                               data-testid="orders-name"
                               @update:modelValue="store.watchItem"
                               v-model="store.item.name"/>
                </VhField>

                <VhField label="Slug">
                    <InputText class="w-full"
                               name="orders-slug"
                               data-testid="orders-slug"
                               v-model="store.item.slug"/>
                </VhField>

                <VhField label="Is Active">
                    <InputSwitch v-bind:false-value="0"
                                 v-bind:true-value="1"
                                 class="p-inputswitch-sm"
                                 name="orders-active"
                                 data-testid="orders-active"
                                 v-model="store.item.is_active"/>
                </VhField>

                <VhField label="Status">
                    <Dropdown class="p-dropdown-sm"
                              :options="store.order_status"
                              name="orders-status"
                              data-testid="orders-status"
                              v-model="store.item.status"
                              placeholder="Select a status"/>
                </VhField>

                <VhField label="Amount">
                    <InputNumber class="w-full"
                                 name="orders-amount"
                                 @input="store.watchAmount"
                                 data-testid="orders-amount"
                                 v-model="store.item.amount"
                                 inputId="currency-india"
                                 locale="en-IN"
                                 mode="currency"
                                 currency="INR"
                                 :max-fraction-digits="4"
                    />
                </VhField>

                <VhField label="Tax">
                    <InputNumber class="w-full"
                                 name="orders-tax"
                                 data-testid="orders-tax"
                                 v-model="store.item.tax"
                                 inputId="currency-india"
                                 locale="en-IN"
                                 mode="currency"
                                 currency="INR"
                                 :max-fraction-digits="4"
                                 readonly
                    />
                </VhField>

                <VhField label="Total Amount">
                    <InputNumber class="w-full"
                                 @input="store.watchTotalAmount"
                                 name="orders-total_amount"
                                 data-testid="orders-total_amount"
                                 inputId="currency-india"
                                 locale="en-IN"
                                 mode="currency"
                                 currency="INR"
                                 :max-fraction-digits="4"
                                 v-model="store.item.total_amount"/>
                </VhField>

            </div>
        </Panel>

    </div>

</template>

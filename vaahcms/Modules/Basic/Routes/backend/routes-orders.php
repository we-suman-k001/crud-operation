<?php


use Illuminate\Support\Facades\Route;

Route::group(
    [
        'prefix' => 'backend/basic/orders',

        'middleware' => ['web', 'has.backend.access'],

        'namespace' => 'Backend',
],
function () {
    /**
     * Get Assets
     */
    Route::get('/assets', 'OrdersController@getAssets')
        ->name('vh.backend.basic.orders.assets');
    /**
     * Get List
     */
    Route::get('/', 'OrdersController@getList')
        ->name('vh.backend.basic.orders.list');
    /**
     * Update status
     */
    Route::put('/change-status','OrdersController@changeStatus')
        ->name('vh.backend.basic.orders.list.change-status');

    /**
     *
     * Update List
     */
    Route::match(['put', 'patch'], '/', 'OrdersController@updateList')
        ->name('vh.backend.basic.orders.list.update');
    /**
     * Delete List
     */
    Route::delete('/', 'OrdersController@deleteList')
        ->name('vh.backend.basic.orders.list.delete');


    /**
     * Fill Form Inputs
     */
    Route::any('/fill', 'OrdersController@fillItem')
        ->name('vh.backend.basic.orders.fill');

    /**
     * Create Item
     */
    Route::post('/', 'OrdersController@createItem')
        ->name('vh.backend.basic.orders.create');
    /**
     * Get Item
     */
    Route::get('/{id}', 'OrdersController@getItem')
        ->name('vh.backend.basic.orders.read');
    /**
     * Update Item
     */
    Route::match(['put', 'patch'], '/{id}', 'OrdersController@updateItem')
        ->name('vh.backend.basic.orders.update');
    /**
     * Delete Item
     */
    Route::delete('/{id}', 'OrdersController@deleteItem')
        ->name('vh.backend.basic.orders.delete');

    /**
     * List Actions
     */
    Route::any('/action/{action}', 'OrdersController@listAction')
        ->name('vh.backend.basic.orders.list.actions');

    /**
     * Item actions
     */
    Route::any('/{id}/action/{action}', 'OrdersController@itemAction')
        ->name('vh.backend.basic.orders.item.action');

    //---------------------------------------------------------

});

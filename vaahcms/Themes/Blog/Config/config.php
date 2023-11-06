<?php

return [
    "name"=> "Blog",
    "title"=> "blog",
    "slug"=> "blog",
    "thumbnail"=> "https://img.site/p/300/160",
    "excerpt"=> "blog",
    "description"=> "blog",
    "download_link"=> "",
    "author_name"=> "blog",
    "author_website"=> "https://vaah.dev",
    "version"=> "v0.0.1",
    "is_migratable"=> true,
    "is_sample_data_available"=> false,
    "db_table_prefix"=> "vh_blog_",
    "providers"=> [
        "\\VaahCms\\Themes\\Blog\\Providers\\BlogServiceProvider"
    ],
    "aside-menu-order"=> null
];

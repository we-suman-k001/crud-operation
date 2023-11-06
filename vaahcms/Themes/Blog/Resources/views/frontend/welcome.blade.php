@extends("blog::frontend.layouts.default")

@section('vaahcms_extend_frontend_head')

@endsection

@section('vaahcms_extend_frontend_css')

@endsection

@section('vaahcms_extend_frontend_scripts')

@endsection

@section('content')
    <div class="container has-text-right mt-6">
        @Auth
            <button class="button-error"><a href="/signout">Sign Out</a></button>
        @endauth
        <button class="p-button-lg p-button-danger p-button-rounded"><a href="/signin">Sign In</a></button>
        <button class="button-error"><a href="/signup">Sign Up</a></button>
    </div>
    <div class="container has-text-centered mt-6">

        <div class="notification is-link is-light">
            This page should contain welcome message which does not require any database to run.
            You can write theme setup information.
        </div>

        <section class="hero">
            <div class="hero-body">
                <p class="title">Blog</p>

                <p class="subtitle">Welcome Page.</p>
                &copy; {!! config('settings.global.copyright_year'); !!}

            </div>
        </section>

    </div>
@endsection

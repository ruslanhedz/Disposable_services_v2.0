class RegLogRouter:
    labels = {'auth', 'contenttypes', 'sessions', 'admin', 'account', 'socialaccount', 'authtoken'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.labels:
            return 'reg_log'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.labels:
            return 'reg_log'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label in self.labels and
            obj2._meta.app_label in self.labels
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.labels:
            return db == 'reg_log'
        elif db == 'reg_log':
            return False
        return None

class SessionsRouter:
    route_app_labels = {'session_manager'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'sessions'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'sessions'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
                obj1._meta.app_label in self.route_app_labels and
                obj2._meta.app_label in self.route_app_labels
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.route_app_labels:
            return db == 'sessions'
        elif db == 'sessions':
            return False
        return None
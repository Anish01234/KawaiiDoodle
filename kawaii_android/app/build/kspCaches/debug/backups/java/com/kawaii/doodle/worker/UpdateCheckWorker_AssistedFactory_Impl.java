package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import dagger.internal.DaggerGenerated;
import dagger.internal.InstanceFactory;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class UpdateCheckWorker_AssistedFactory_Impl implements UpdateCheckWorker_AssistedFactory {
  private final UpdateCheckWorker_Factory delegateFactory;

  UpdateCheckWorker_AssistedFactory_Impl(UpdateCheckWorker_Factory delegateFactory) {
    this.delegateFactory = delegateFactory;
  }

  @Override
  public UpdateCheckWorker create(Context p0, WorkerParameters p1) {
    return delegateFactory.get(p0, p1);
  }

  public static Provider<UpdateCheckWorker_AssistedFactory> create(
      UpdateCheckWorker_Factory delegateFactory) {
    return InstanceFactory.create(new UpdateCheckWorker_AssistedFactory_Impl(delegateFactory));
  }

  public static dagger.internal.Provider<UpdateCheckWorker_AssistedFactory> createFactoryProvider(
      UpdateCheckWorker_Factory delegateFactory) {
    return InstanceFactory.create(new UpdateCheckWorker_AssistedFactory_Impl(delegateFactory));
  }
}
